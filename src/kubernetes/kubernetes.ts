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


function dataFetchers(type: RuntimeType, namespace: string) {
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



async function fetchAndSaveData(type, namespace) {
  for (const [dir, fetcher] of Object.entries(dataFetchers(type, namespace))) {
    const resources = await fetcher();

    await saveItems(resources.items, dir);

    if (dir === 'Pods') {
      await Promise.all(resources.items.map(async (item) => {
        const podName = item.metadata.name;
        const containers = item.spec.containers;

        await Promise.all(containers.map(async (container) => {
          let log;
          try {
            log = await coreApi.namespace(namespace).getPodLog(podName, {
              container: container.name,
              timestamps: true,
            });
          } catch (error) {
            console.error(`Failed to get logs for container ${container.name} in pod ${podName}:`, error);
            log = error.toString();
          }
          const logFileName = `${dirPath}/${dir}/${podName}_${container.name}_log.log`;
          await Deno.writeTextFile(logFileName, log);
        }));

        await describeItems(dir, namespace, podName);
      }));
    }

    if (dir === 'Nodes') {
      await Promise.all(resources.items.map(async (item) => {
        await describeItems(dir, namespace, item.metadata.name);
      }));
    }
  }
  await saveHelmReleases(type, namespace);
  await saveEvents(namespace);
  const listPods = new Deno.Command('kubectl', { args: ['get', 'pods', '-n', namespace] });
  const output = await listPods.output();
  await Deno.writeTextFile(`${dirPath}/ListPods.txt`, new TextDecoder().decode(output.stdout));
}
