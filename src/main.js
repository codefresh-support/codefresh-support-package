'use strict';

import { Codefresh } from './codefresh.js';
import { autoDetectClient } from '@cloudydeno/kubernetes-client';
import { AppsV1Api } from '@cloudydeno/kubernetes-apis/apps/v1';
import { BatchV1Api } from '@cloudydeno/kubernetes-apis/batch/v1';
import { CoreV1Api } from '@cloudydeno/kubernetes-apis/core/v1';
import { StorageV1Api } from '@cloudydeno/kubernetes-apis/storage.k8s.io/v1';
import { ArgoprojIoV1alpha1Api } from '@cloudydeno/kubernetes-apis/argoproj.io/v1alpha1';

import { compress } from '@fakoua/zip-ts';
import { stringify as toYaml } from '@std/yaml';

console.log('Initializing \n');
const kubeConfig = await autoDetectClient();
const appsApi = new AppsV1Api(kubeConfig);
const coreApi = new CoreV1Api(kubeConfig);
const storageApi = new StorageV1Api(kubeConfig);
const batchApi = new BatchV1Api(kubeConfig);
const argoProj = new ArgoprojIoV1alpha1Api(kubeConfig);
const timestamp = new Date().getTime();
const dirPath = `./codefresh-support-${timestamp}`;

function selectRuntimeType() {
  const reTypes = ['Pipelines Runtime', 'GitOps Runtime', 'On-Prem'];
  reTypes.forEach((reType, index) => {
    console.log(`${index + 1}. ${reType}`);
  });

  let typeSelected = Number(prompt('\nWhich Type Of Runtime Are We Using? (Number):'));
  while (isNaN(typeSelected) || typeSelected < 1 || typeSelected > reTypes.length) {
    console.log('Invalid selection. Please enter a number corresponding to one of the listed runtime types.');
    typeSelected = Number(prompt('\nWhich Type Of Runtime Are We Using? (Number):'));
  }

  return reTypes[typeSelected - 1];
}

async function saveItems(resources, dir) {
  try {
    await Deno.mkdir(`${dirPath}/${dir}/`, { recursive: true });
    const writePromises = resources.map(async (item) => {
      const filePath = `${dirPath}/${dir}/${item.metadata.name}_get.yaml`;
      const fileContent = toYaml(item, { skipInvalid: true });
      await Deno.writeTextFile(filePath, fileContent);
    });
    await Promise.all(writePromises);
  } catch (error) {
    console.error(`Error saving items to ${dir}:`, error);
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

async function saveEvents(namespace) {
  try {
    const events = new Deno.Command('kubectl', { args: ['get', 'events', '-n', namespace, '--sort-by=.metadata.creationTimestamp'] });
    const output = await events.output();
    await Deno.writeTextFile(`${dirPath}/Events.txt`, new TextDecoder().decode(output.stdout));
  } catch (error) {
    console.error(`Error saving events:`, error);
  }
}

async function saveHelmReleases(type, namespace) {
  try {
    const helmList = new Deno.Command('helm', { args: ['list', '-n', namespace, '-o', 'json'] });
    const output = await helmList.output();
    const helmReleases = JSON.parse(new TextDecoder().decode(output.stdout));
    await Deno.writeTextFile(`${dirPath}/${type}_helmReleases.yaml`, toYaml(helmReleases, { skipInvalid: true }));
  } catch (error) {
    console.error(`Error saving Helm releases for ${type}:`, error);
  }
}

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

async function gatherPipelines() {
  try {
    const cf = new Codefresh();
    await cf.init();
    const reNames = await cf.getAllRuntimes();
    console.log('');
    reNames.forEach((re, index) => {
      console.log(`${index + 1}. ${re}`);
    });

    let selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
    while (isNaN(selection) || selection < 1 || selection > reNames.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed runtimes.');
      selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
    }

    const reSpec = cf.runtimes[selection - 1];
    const namespace = reSpec.runtimeScheduler.cluster.namespace;

    console.log(`\nGathering Data For ${reSpec.metadata.name}.`);

    await fetchAndSaveData('Pipelines Runtime', namespace);

    await Deno.writeTextFile(`${dirPath}/runtimeSpec.yaml`, toYaml(reSpec, { skipInvalid: true }));
  } catch (error) {
    console.error(`Error gathering Pipelines Runtime data:`, error);
  }
}

async function gatherGitOps() {
  try {
    const namespaceList = await coreApi.getNamespaceList();
    console.log('');
    namespaceList.items.forEach((ns, index) => {
      console.log(`${index + 1}. ${ns.metadata.name}`);
    });

    let selection = Number(prompt('\nWhich Namespace Is The GitOps Runtime Installed In? (Number): '));
    while (isNaN(selection) || selection < 1 || selection > namespaceList.items.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed namespaces.');
      selection = Number(prompt('\nWhich Namespace Is The GitOps Runtime Installed In? (Number): '));
    }

    const namespace = namespaceList.items[selection - 1].metadata.name;

    console.log(`\nGathering Data In ${namespace} For The GitOps Runtime.`);

    await fetchAndSaveData('GitOps Runtime', namespace);
  } catch (error) {
    console.error(`Error gathering GitOps runtime data:`, error);
  }
}

async function gatherOnPrem() {
  try {
    const cf = new Codefresh();
    await cf.init();
    if (cf.apiURL === 'https://g.codefresh.io') {
      throw new Error('The API URL is not an On Prem instance. Please use Pipelines Runtime or GitOps Runtime.');
    }
    const accounts = await cf.getOnPremAccounts();
    const runtimes = await cf.getOnPremRuntimes();
    const userTotal = await cf.getOnPremUserTotal();
    const systemFF = await cf.getOnPremSystemFF();

    const namespaceList = await coreApi.getNamespaceList();
    console.log('');
    namespaceList.items.forEach((ns, index) => {
      console.log(`${index + 1}. ${ns.metadata.name}`);
    });

    let selection = Number(prompt('\nWhich Namespace Is Codefresh OnPrem Installed In? (Number): '));
    while (isNaN(selection) || selection < 1 || selection > namespaceList.items.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed namespaces.');
      selection = Number(prompt('\nWhich Namespace Is Codefresh OnPrem Installed In? (Number): '));
    }

    const namespace = namespaceList.items[selection - 1].metadata.name;

    console.log(`\nGathering Data For On Prem.`);

    await fetchAndSaveData('On-Prem', namespace);

    await Deno.writeTextFile(`${dirPath}/onPremAccounts.yaml`, toYaml(accounts, { skipInvalid: true }));
    await Deno.writeTextFile(`${dirPath}/onPremRuntimes.yaml`, toYaml(runtimes, { skipInvalid: true }));
    await Deno.writeTextFile(`${dirPath}/onPremUserTotal.txt`, userTotal.toString());
    await Deno.writeTextFile(`${dirPath}/onPremSystemFF.yaml`, toYaml(systemFF, { skipInvalid: true }));
  } catch (error) {
    console.error(`Error gathering On Prem data:`, error);
  }
}

async function main() {
  try {
    const runtimeType = selectRuntimeType();

    switch (runtimeType) {
      case 'Pipelines Runtime':
        await gatherPipelines();
        break;
      case 'GitOps Runtime':
        await gatherGitOps();
        break;
      case 'On-Prem':
        await gatherOnPrem();
        break;
    }

    console.log(`\nSaving data to ./codefresh-support-package-${timestamp}.zip`);
    await compress(dirPath, `./codefresh-support-package-${timestamp}.zip`, { overwrite: true });

    console.log('\nCleaning up temp directory');
    await Deno.remove(dirPath, { recursive: true });

    console.log(`\nPlease attach ./codefresh-support-package-${timestamp}.zip to your support ticket.`);
    console.log('Before attaching, verify the contents and remove any sensitive information.');
  } catch (error) {
    console.error(`Error:`, error);
  }
}

await main();
