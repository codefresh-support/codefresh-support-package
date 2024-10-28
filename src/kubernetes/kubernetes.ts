import type { EventList, PersistentVolumeClaimList, PersistentVolumeList, PodList, SecretList } from '../deps.ts';

import {
  AppsV1Api,
  ArgoprojIoV1alpha1Api,
  autoDetectClient,
  BatchV1Api,
  CoreV1Api,
  decodeBase64,
  RuntimeType,
  StorageV1Api,
  Table,
  ungzip,
} from '../deps.ts';

const kubeConfig = await autoDetectClient();
const appsApi = new AppsV1Api(kubeConfig);
const coreApi = new CoreV1Api(kubeConfig);
const storageApi = new StorageV1Api(kubeConfig);
const batchApi = new BatchV1Api(kubeConfig);
const argoProj = new ArgoprojIoV1alpha1Api(kubeConfig);

export async function selectNamespace() {
  const namespaceList = await coreApi.getNamespaceList();
  console.log('');
  namespaceList.items.forEach((namespace, index: number) => {
    console.log(`${index + 1}. ${namespace.metadata?.name}`);
  });

  let selection = Number(prompt('\nWhich Namespace Is Codefresh Installed In? (Number): '));
  while (isNaN(selection) || selection < 1 || selection > namespaceList.items.length) {
    console.log('Invalid selection. Please enter a number corresponding to one of the listed namespaces.');
    selection = Number(prompt('\nWhich Namespace Is Codefresh Installed In? (Number): '));
  }

  const namespace = namespaceList.items[selection - 1].metadata?.name;

  if (!namespace) {
    throw new Error('Selected namespace is invalid.');
  }

  return namespace;
}

export function getK8sResources(runtimeType: RuntimeType, namespace: string) {
  switch (runtimeType) {
    case RuntimeType.pipelines:
      return {
        'CronJobs': () => batchApi.namespace(namespace).getCronJobList(),
        'Jobs': () => batchApi.namespace(namespace).getJobList(),
        'Deployments': () => appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': () => appsApi.namespace(namespace).getDaemonSetList(),
        'Nodes': () => coreApi.getNodeList(),
        'Volumes': () => coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
        'Volumeclaims': () =>
          coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
        'Configmaps': () =>
          coreApi.namespace(namespace).getConfigMapList({ labelSelector: 'app.kubernetes.io/name=cf-runtime' }),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Storageclass': () => storageApi.getStorageClassList(),
        'Events': () => coreApi.namespace(namespace).getEventList(),
        'HelmReleases': () => coreApi.namespace(namespace).getSecretList({ labelSelector: 'owner=helm' }),
      };
    case RuntimeType.gitops:
      return {
        'Apps': () => argoProj.namespace(namespace).getApplicationList(),
        'AppSets': () => argoProj.namespace(namespace).getApplicationSetList(),
        'CronJobs': () => batchApi.namespace(namespace).getCronJobList(),
        'Jobs': () => batchApi.namespace(namespace).getJobList(),
        'Deployments': () => appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': () => appsApi.namespace(namespace).getDaemonSetList(),
        'Statefulsets': () => appsApi.namespace(namespace).getStatefulSetList(),
        'Nodes': () => coreApi.getNodeList(),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList(),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Events': () => coreApi.namespace(namespace).getEventList(),
        'HelmReleases': () => coreApi.namespace(namespace).getSecretList({ labelSelector: 'owner=helm' }),
      };
    case RuntimeType.onprem:
      return {
        'CronJobs': () => batchApi.namespace(namespace).getCronJobList(),
        'Jobs': () => batchApi.namespace(namespace).getJobList(),
        'Deployments': () => appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': () => appsApi.namespace(namespace).getDaemonSetList(),
        'Nodes': () => coreApi.getNodeList(),
        'Volumes': () => coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
        'Volumeclaims': () =>
          coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList(),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Storageclass': () => storageApi.getStorageClassList(),
        'Events': () => coreApi.namespace(namespace).getEventList(),
        'HelmReleases': () => coreApi.namespace(namespace).getSecretList({ labelSelector: 'owner=helm' }),
      };
    default:
      console.error('Invalid runtime type selected');
      return;
  }
}

function calculateAge(creationTimestamp: Date) {
  const now = new Date();
  const diffMs = now.getTime() - creationTimestamp.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffDays}d ${diffHours}h ${diffMinutes}m`;
}

export function getFormattedEvents(events: EventList) {
  // Sort the events by .metadata.creationTimestamp
  const sortedEvents = events.items.sort((a, b) => {
    const dateA = a.metadata.creationTimestamp ? new Date(a.metadata.creationTimestamp).getTime() : 0;
    const dateB = b.metadata.creationTimestamp ? new Date(b.metadata.creationTimestamp).getTime() : 0;
    return dateA - dateB;
  });

  const formattedEvents = sortedEvents.length > 0
    ? sortedEvents.map((event) => {
      const lastSeen = event.lastTimestamp ? calculateAge(event.lastTimestamp) : 'N/A';
      const type = event.type ?? 'N/A';
      const reason = event.reason ?? 'N/A';
      const kind = event.involvedObject.kind ?? 'N/A';
      const name = event.involvedObject.name ?? 'N/A';
      const message = event.message ?? 'N/A';
      return {
        lastSeen,
        type,
        reason,
        kind,
        name,
        message,
      };
    })
    : [{
      lastSeen: 'N/A',
      type: 'N/A',
      reason: 'N/A',
      kind: 'N/A',
      name: 'N/A',
      message: 'N/A',
    }];

  const table = new Table();
  table.fromJson(formattedEvents);
  return table.toString();
}

export function getHelmReleases(secrets: SecretList) {
  const helmReleases = secrets.items.map((secret) => {
    const releaseData = secret.data?.release;
    if (!releaseData) {
      throw new Error('Release data is undefined');
    }
    const firstDecodedData = decodeBase64(releaseData);
    const secondDecodedData = decodeBase64(new TextDecoder().decode(firstDecodedData));
    const extractedData = JSON.parse(ungzip(secondDecodedData, { to: 'string' }));

    const helmInfo = {
      'name': extractedData.name,
      'namespace': extractedData.namespace,
      'revision': extractedData.version,
      'updated': extractedData.info.last_deployed,
      'status': extractedData.info.status,
      'chart': `${extractedData.chart.metadata.name}-${extractedData.chart.metadata.version}`,
      'appVersion': extractedData.chart.metadata.appVersion,
    };
    return helmInfo;
  });

  return helmReleases;
}

// TODO: convert using the kubernetes sdk

export async function describeK8sResources(resourceType: string, namespace: string, name: string) {
  const describe = new Deno.Command('kubectl', {
    args: ['describe', resourceType.toLowerCase(), '-n', namespace, name],
  });

  return new TextDecoder().decode((await describe.output()).stdout);
}

export async function getK8sLogs(namespace: string, podName: string, containerName: string) {
  try {
    const logs = await coreApi.namespace(namespace).getPodLog(podName, {
      container: containerName,
      timestamps: true,
    });
    return logs;
  } catch (error) {
    return (error as any).message;
  }
}

export function getPodList(pods: PodList) {
  const podList = pods.items.length > 0
    ? pods.items.map((pod) => {
      const name = pod.metadata?.name ?? 'N/A';
      const ready = `${pod.status?.containerStatuses?.filter((cs) => cs.ready).length ?? 0}/${
        pod.status?.containerStatuses?.length ?? 0
      }`;
      const status = pod.status?.phase ?? 'Unknown';
      const restarts = pod.status?.containerStatuses?.reduce((acc, cur) => acc + (cur.restartCount ?? 0), 0) ?? 0;
      const age = pod.metadata?.creationTimestamp ? calculateAge(pod.metadata.creationTimestamp) : 'N/A';
      return {
        name,
        ready,
        status,
        restarts,
        age,
      };
    })
    : [{
      name: 'N/A',
      ready: 'N/A',
      status: 'N/A',
      restarts: 'N/A',
      age: 'N/A',
    }];
  const table = new Table();
  table.fromJson(podList);
  return table.toString();
}

export function getPVCList(Volumeclaims: PersistentVolumeClaimList) {
  const formattedPVC = Volumeclaims.items.length > 0
    ? Volumeclaims.items.map((pvc) => {
      const name = pvc.metadata?.name ?? 'N/A';
      const status = pvc.status?.phase ?? 'Unknown';
      const volume = pvc.spec?.volumeName ?? 'N/A';
      const capacity = `${pvc.spec?.resources?.requests?.storage?.number ?? 'N/A'} ${
        pvc.spec?.resources?.requests?.storage.suffix ?? 'N/A'
      }`;
      const accessModes = pvc.spec?.accessModes?.join(', ') ?? 'N/A';
      const storageClass = pvc.spec?.storageClassName ?? 'N/A';
      const age = pvc.metadata?.creationTimestamp ? calculateAge(pvc.metadata.creationTimestamp) : 'N/A';
      return {
        name,
        status,
        volume,
        capacity,
        accessModes,
        storageClass,
        age,
      };
    })
    : [{
      name: 'N/A',
      status: 'N/A',
      volume: 'N/A',
      capacity: 'N/A',
      accessModes: 'N/A',
      storageClass: 'N/A',
      age: 'N/A',
    }];

  const table = new Table();
  table.fromJson(formattedPVC);
  return table.toString();
}

export function getPVList(Volumes: PersistentVolumeList) {
  const formattedPV = Volumes.items.length > 0
    ? Volumes.items.map((pv) => {
      const name = pv.metadata?.name ?? 'N/A';
      const capacity = `${pv.spec?.capacity?.storage?.number ?? 'N/A'} ${pv.spec?.capacity?.storage.suffix ?? 'N/A'}`;
      const accessModes = pv.spec?.accessModes?.join(', ') ?? 'N/A';
      const reclaimPolicy = pv.spec?.persistentVolumeReclaimPolicy ?? 'N/A';
      const status = pv.status?.phase ?? 'Unknown';
      const claim = `${pv.spec?.claimRef?.namespace ?? 'N/A'}/${pv.spec?.claimRef?.name ?? 'N/A'}`;
      const storageClass = pv.spec?.storageClassName ?? 'N/A';
      const age = pv.metadata?.creationTimestamp ? calculateAge(pv.metadata.creationTimestamp) : 'N/A';
      return {
        name,
        capacity,
        accessModes,
        reclaimPolicy,
        status,
        claim,
        storageClass,
        age,
      };
    })
    : [{
      name: 'N/A',
      capacity: 'N/A',
      accessModes: 'N/A',
      reclaimPolicy: 'N/A',
      status: 'N/A',
      claim: 'N/A',
      storageClass: 'N/A',
      age: 'N/A',
    }];

  const table = new Table();
  table.fromJson(formattedPV);
  return table.toString();
}

export async function cleanTestPipelinePods(namespace: string, buildID: string) {
  await Promise.all([
    coreApi.namespace(namespace).deletePod(`dind-${buildID}`),
    coreApi.namespace(namespace).deletePod(`engine-${buildID}`),
  ]);
}