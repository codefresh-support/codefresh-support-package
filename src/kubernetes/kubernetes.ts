import type { EventList, PodList, SecretList, PersistentVolumeClaimList, PersistentVolumeList } from '../deps.ts';
import { AppsV1Api, ArgoprojIoV1alpha1Api, autoDetectClient, BatchV1Api, CoreV1Api, decodeBase64, RuntimeType, StorageV1Api, ungzip, Table } from '../deps.ts';

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

  let selection = Number(prompt('\nWhich Namespace Is The GitOps Runtime Installed In? (Number): '));
  while (isNaN(selection) || selection < 1 || selection > namespaceList.items.length) {
    console.log('Invalid selection. Please enter a number corresponding to one of the listed namespaces.');
    selection = Number(prompt('\nWhich Namespace Is The GitOps Runtime Installed In? (Number): '));
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
        'Cron': batchApi.namespace(namespace).getCronJobList(),
        'Jobs': batchApi.namespace(namespace).getJobList(),
        'Deployments': appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': appsApi.namespace(namespace).getDaemonSetList(),
        'Nodes': coreApi.getNodeList(),
        'Volumes': coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
        'Volumeclaims': coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
        'Configmaps': coreApi.namespace(namespace).getConfigMapList({ labelSelector: 'app.kubernetes.io/name=cf-runtime' }),
        'Services': coreApi.namespace(namespace).getServiceList(),
        'Pods': coreApi.namespace(namespace).getPodList(),
        'Storageclass': storageApi.getStorageClassList(),
        'Events': coreApi.namespace(namespace).getEventList(),
        'HelmReleases': coreApi.namespace(namespace).getSecretList({ labelSelector: 'owner=helm' }),
      };
    case RuntimeType.gitops:
      return {
        'Apps': argoProj.namespace(namespace).getApplicationList(),
        'AppSets': argoProj.namespace(namespace).getApplicationSetList(),
        'Cron': batchApi.namespace(namespace).getCronJobList(),
        'Jobs': batchApi.namespace(namespace).getJobList(),
        'Deployments': appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': appsApi.namespace(namespace).getDaemonSetList(),
        'Statefulsets': appsApi.namespace(namespace).getStatefulSetList(),
        'Nodes': coreApi.getNodeList(),
        'Configmaps': coreApi.namespace(namespace).getConfigMapList(),
        'Services': coreApi.namespace(namespace).getServiceList(),
        'Pods': coreApi.namespace(namespace).getPodList(),
        'Events': coreApi.namespace(namespace).getEventList(),
        'HelmReleases': coreApi.namespace(namespace).getSecretList({ labelSelector: 'owner=helm' }),
      };
    case RuntimeType.onprem:
      return {
        'Cron': batchApi.namespace(namespace).getCronJobList(),
        'Jobs': batchApi.namespace(namespace).getJobList(),
        'Deployments': appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': appsApi.namespace(namespace).getDaemonSetList(),
        'Nodes': coreApi.getNodeList(),
        'Volumes': coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
        'Volumeclaims': coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
        'Configmaps': coreApi.namespace(namespace).getConfigMapList(),
        'Services': coreApi.namespace(namespace).getServiceList(),
        'Pods': coreApi.namespace(namespace).getPodList(),
        'Storageclass': storageApi.getStorageClassList(),
        'Events': coreApi.namespace(namespace).getEventList(),
        'HelmReleases': coreApi.namespace(namespace).getSecretList({ labelSelector: 'owner=helm' }),
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

  // Format the output to match kubectl style
  const formattedEvents = sortedEvents.map((event) => {
    const { lastTimestamp, type, reason, message, involvedObject } = event;
    const { name, kind } = involvedObject;
    const lastSeen = lastTimestamp ? calculateAge(lastTimestamp) : 'N/A';
    return `${lastSeen}\t${type}\t${reason}\t${kind}\t${name}\t${message}`;
  });

  return formattedEvents.join('\n');
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

// TODO: // convert using the kubernetes sdk

export async function describeK8sResources(resourceType: string, namespace: string, name: string) {
  const describe = new Deno.Command('kubectl', { args: ['describe', resourceType.toLowerCase(), '-n', namespace, name] });
  
  return new TextDecoder().decode((await describe.output()).stdout);
}

export async function getK8sLogs(namespace: string, podName: string, containerName: string) {
  return await coreApi.namespace(namespace).getPodLog(podName, {
    container: containerName,
    timestamps: true,
  });
}

export function getPodList(pods: PodList) {
  const table = new Table();
  table.theme = Table.roundTheme;
  table.headers = ['Name', 'Ready', 'Status', 'Restarts', 'Age'];


  pods.items.forEach((pod) => {
    const { metadata, status } = pod;
    const podInfo = [
      metadata?.name ?? 'N/A',
      `${status?.containerStatuses?.filter(cs => cs.ready).length ?? 0}/${status?.containerStatuses?.length ?? 0}`,
      status?.phase ?? 'Unknown',
      status?.containerStatuses?.reduce((acc, cur) => acc + (cur.restartCount ?? 0), 0) ?? 0,
      metadata?.creationTimestamp ? calculateAge(metadata.creationTimestamp) : 'N/A',
    ];
    table.rows.push(podInfo);
  });

  return table.toString();
}

export function getPVCList(Volumeclaims: PersistentVolumeClaimList) {
  const table = new Table();
  table.theme = Table.roundTheme;
  table.headers = ['Name', 'Status', 'Volume', 'Capacity', 'Access Modes', 'Storage Class', 'Age'];

  Volumeclaims.items.forEach((pvc) => {
    const { metadata, status, spec } = pvc;
    const pvcInfo = [
      metadata?.name ?? 'N/A',
      status?.phase ?? 'Unknown',
      spec?.volumeName ?? 'N/A',
      `${spec?.resources?.requests?.storage?.number ?? 'N/A'} ${spec?.resources?.requests?.storage.suffix ?? 'N/A'}`,
      spec?.accessModes?.join(', ') ?? 'N/A',
      spec?.storageClassName ?? 'N/A',
      metadata?.creationTimestamp ? calculateAge(metadata.creationTimestamp) : 'N/A',
    ];
    table.rows.push(pvcInfo);
  });

  return table.toString();
}

export function getPVList(Volumes: PersistentVolumeList) {
  const table = new Table();
  table.theme = Table.roundTheme;
  table.headers = ['Name', 'Capacity', 'Access Modes', 'Reclaim Policy', 'Status', 'Claim', 'Storage Class', 'Age'];

  Volumes.items.forEach((pv) => {
    const { metadata, status, spec } = pv;
    const pvInfo = [
      metadata?.name ?? 'N/A',
      `${spec?.capacity?.storage?.number ?? 'N/A'} ${spec?.capacity?.storage.suffix ?? 'N/A'}`,
      spec?.accessModes?.join(', ') ?? 'N/A',
      spec?.persistentVolumeReclaimPolicy ?? 'N/A',
      status?.phase ?? 'Unknown',
      `${spec?.claimRef?.namespace ?? 'N/A'}/${spec?.claimRef?.name ?? 'N/A'}`,
      spec?.storageClassName ?? 'N/A',
      metadata?.creationTimestamp ? calculateAge(metadata.creationTimestamp) : 'N/A',
    ];
    table.rows.push(pvInfo);
  });

  return table.toString();
}