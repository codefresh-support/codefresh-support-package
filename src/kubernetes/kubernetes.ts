import { AppsV1Api, ArgoprojIoV1alpha1Api, autoDetectClient, BatchV1Api, CoreV1Api, StorageV1Api, RuntimeType } from '../deps.ts';

const kubeConfig = await autoDetectClient();
const appsApi = new AppsV1Api(kubeConfig);
const coreApi = new CoreV1Api(kubeConfig);
const storageApi = new StorageV1Api(kubeConfig);
const batchApi = new BatchV1Api(kubeConfig);
const argoProj = new ArgoprojIoV1alpha1Api(kubeConfig);

export async function selectNamespace() {
  const namespaceList = await coreApi.getNamespaceList();
  console.log('');
  namespaceList.items.forEach((namespace, index) => {
    console.log(`${index + 1}. ${namespace.metadata?.name}`);
  });

  let selection = Number(prompt('\nWhich Namespace Is The GitOps Runtime Installed In? (Number): '));
  while (isNaN(selection) || selection < 1 || selection > namespaceList.items.length) {
    console.log('Invalid selection. Please enter a number corresponding to one of the listed namespaces.');
    selection = Number(prompt('\nWhich Namespace Is The GitOps Runtime Installed In? (Number): '));
  }

  return namespaceList.items[selection - 1].metadata?.name;
}


export function getK8sResources(type: RuntimeType, namespace: string) {
  switch (type) {
    case RuntimeType.pipelines:
      return {
        'Cron': () => batchApi.namespace(namespace).getCronJobList(),
        'Jobs': () => batchApi.namespace(namespace).getJobList(),
        'Deployments': () => appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': () => appsApi.namespace(namespace).getDaemonSetList(),
        'Nodes': () => coreApi.getNodeList(),
        'Volumes': () => coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
        'Volumeclaims': () => coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList({ labelSelector: 'app.kubernetes.io/name=cf-runtime' }),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Storageclass': () => storageApi.getStorageClassList(),
      };
    case RuntimeType.gitops:
      return {
        'Argo-Apps': () => argoProj.namespace(namespace).getApplicationList(),
        'Argo-AppSets': () => argoProj.namespace(namespace).getApplicationSetList(),
        'Cron': () => batchApi.namespace(namespace).getCronJobList(),
        'Jobs': () => batchApi.namespace(namespace).getJobList(),
        'Deployments': () => appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': () => appsApi.namespace(namespace).getDaemonSetList(),
        'Statefulsets': () => appsApi.namespace(namespace).getStatefulSetList(),
        'Nodes': () => coreApi.getNodeList(),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList(),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
      };
    case RuntimeType.onprem:
      return {
        'Cron': () => batchApi.namespace(namespace).getCronJobList(),
        'Jobs': () => batchApi.namespace(namespace).getJobList(),
        'Deployments': () => appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': () => appsApi.namespace(namespace).getDaemonSetList(),
        'Nodes': () => coreApi.getNodeList(),
        'Volumes': () => coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
        'Volumeclaims': () => coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList(),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Storageclass': () => storageApi.getStorageClassList(),
      };
    default:
      console.error('Invalid runtime type selected');
      return;
  }
}

// TODO: // convert using the kubernetes sdk
export async function getK8sEvents(namespace: string) {
  try {
    const events = await coreApi.namespace(namespace).getEventList({ sortBy: '.metadata.creationTimestamp' });
    // const events = new Deno.Command('kubectl', { args: ['get', 'events', '-n', namespace, '--sort-by=.metadata.creationTimestamp'] });
    // const output = await events.output();
    await Deno.writeTextFile(`${dirPath}/Events.txt`, new TextDecoder().decode(output.stdout));
  } catch (error) {
    console.error(`Error saving events:`, error);
  }
}

// TODO: // convert using the kubernetes sdk

export async function describeK8sResources(dir, namespace, name) {
  try {
    const describe = new Deno.Command('kubectl', { args: ['describe', dir.toLowerCase(), '-n', namespace, name] });
    const output = await describe.output();
    await Deno.writeTextFile(`${dirPath}/${dir}/${name}_describe.yaml`, new TextDecoder().decode(output.stdout));
  } catch (error) {
    console.error(`Failed to describe ${name}:`, error);
  }
}

// TODO: // convert using the kubernetes sdk
export async function getHelmReleases(namespace: string) {
  try {
    const helmList = new Deno.Command('helm', { args: ['list', '-n', namespace, '-o', 'json'] });
    const output = await helmList.output();
    const helmReleases = JSON.parse(new TextDecoder().decode(output.stdout));
    return helmReleases;
  } catch (error) {
    console.error(error);
  }
}


