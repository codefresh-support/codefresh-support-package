import { AppsV1Api, ArgoprojIoV1alpha1Api, autoDetectClient, BatchV1Api, CoreV1Api, StorageV1Api } from '../deps.ts';

const kubeConfig = await autoDetectClient();
const appsApi = new AppsV1Api(kubeConfig);
const coreApi = new CoreV1Api(kubeConfig);
const storageApi = new StorageV1Api(kubeConfig);
const batchApi = new BatchV1Api(kubeConfig);
const argoProj = new ArgoprojIoV1alpha1Api(kubeConfig);


function dataFetchers(type, namespace) {
  switch (type) {
    case 'Pipelines Runtime':
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
    case 'GitOps Runtime':
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
    case 'On-Prem':
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

async function saveEvents(namespace) {
  try {
    const events = new Deno.Command('kubectl', { args: ['get', 'events', '-n', namespace, '--sort-by=.metadata.creationTimestamp'] });
    const output = await events.output();
    await Deno.writeTextFile(`${dirPath}/Events.txt`, new TextDecoder().decode(output.stdout));
  } catch (error) {
    console.error(`Error saving events:`, error);
  }
}

async function describeItems(dir, namespace, name) {
  try {
    const describe = new Deno.Command('kubectl', { args: ['describe', dir.toLowerCase(), '-n', namespace, name] });
    const output = await describe.output();
    await Deno.writeTextFile(`${dirPath}/${dir}/${name}_describe.yaml`, new TextDecoder().decode(output.stdout));
  } catch (error) {
    console.error(`Failed to describe ${name}:`, error);
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
