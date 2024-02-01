'use strict';

import { Codefresh } from './codefresh.js';
import { autoDetectClient } from 'https://deno.land/x/kubernetes_client@v0.7.2/mod.ts';
import { AppsV1Api } from 'https://deno.land/x/kubernetes_apis@v0.5.0/builtin/apps@v1/mod.ts';
import { BatchV1Api } from 'https://deno.land/x/kubernetes_apis@v0.5.0/builtin/batch@v1/mod.ts';
import { CoreV1Api } from 'https://deno.land/x/kubernetes_apis@v0.5.0/builtin/core@v1/mod.ts';
import { StorageV1Api } from 'https://deno.land/x/kubernetes_apis@v0.5.0/builtin/storage.k8s.io@v1/mod.ts';
import { ArgoprojIoV1alpha1Api } from 'https://deno.land/x/kubernetes_apis@v0.5.0/argo-cd/argoproj.io@v1alpha1/mod.ts';
import { compress } from 'https://deno.land/x/zip@v1.2.5/mod.ts';
import { stringify as toYaml } from 'https://deno.land/std@0.211.0/yaml/mod.ts';

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
  const reTypes = ['classic', 'gitops', 'onprem'];
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
      const filePath = `${dirPath}/${dir}/${item.metadata.name}.yaml`;
      const fileContent = toYaml(item, { skipInvalid: true });
      await Deno.writeTextFile(filePath, fileContent);
    });

    await Promise.all(writePromises);
  } catch (error) {
    console.error(`Error saving items to ${dir}:`, error);
  }
}

async function saveHelmReleases(type, namespace) {
  try {
    const helmList = new Deno.Command('helm', { args: ['list', '-n', namespace, '-o', 'json'] });
    const output = await helmList.output();
    const helmReleases = JSON.parse(new TextDecoder().decode(output.stdout));
    await Deno.writeTextFile(`${dirPath}/${type}-helmReleases.yaml`, toYaml(helmReleases, { skipInvalid: true }));
  } catch (error) {
    console.error(`Error saving Helm releases for ${type}:`, error);
  }
}


function dataFetchers(type, namespace) {
  switch (type) {
    case 'classic':
      return {
        'Cron': () => batchApi.namespace(namespace).getCronJobList(),
        'Jobs': () => batchApi.namespace(namespace).getJobList(),
        'Nodes': () => coreApi.getNodeList(),
        'Volumes': () => coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
        'Volumeclaims': () => coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList({ labelSelector: 'app.kubernetes.io/name=cf-runtime' }),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Events': () => coreApi.namespace(namespace).getEventList(),
        'Storageclass': () => storageApi.getStorageClassList(),
      };
    case 'gitops':
      return {
        'Apps': () => argoProj.namespace(namespace).getApplicationList(),
        'Nodes': () => coreApi.getNodeList(),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList(),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Events': () => coreApi.namespace(namespace).getEventList(),
      };
    case 'onprem':
      return {
        'Deployments': () => appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': () => appsApi.namespace(namespace).getDaemonSetList(),
        'Nodes': () => coreApi.getNodeList(),
        'Volumes': () => coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
        'Volumeclaims': () => coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Events': () => coreApi.namespace(namespace).getEventList(),
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
        let log;
        try {
          log = await coreApi.namespace(namespace).getPodLog(item.metadata.name, { container: item.spec.containers[0].name });
        } catch (error) {
          console.error(`Failed to get logs for ${item.metadata.name}:`, error);
          log = error;
        }
        await Deno.writeTextFile(`${dirPath}/${dir}/${item.metadata.name}.log`, log);
      }));
    }
  }
  await saveHelmReleases(type, namespace);
}

async function gatherClassic() {
  try {
    const cf = new Codefresh();
    await cf.init();
    const reNames = await cf.getAllRuntimes();
    console.log('');
    reNames.forEach((re, index) => {
      console.log(`${index + 1}. ${re}`);
    });

    let selection = Number(prompt('\nWhich Classic Runtime Are We Working With? (Number): '));
    while (isNaN(selection) || selection < 1 || selection > reNames.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed runtimes.');
      selection = Number(prompt('\nWhich Classic Runtime Are We Working With? (Number): '));
    }

    const reSpec = cf.runtimes[selection - 1];
    const namespace = reSpec.runtimeScheduler.cluster.namespace;

    console.log(`\nGathering Data For ${reSpec.metadata.name}.`);

    await fetchAndSaveData('classic', namespace);

    await Deno.writeTextFile(`${dirPath}/runtimeSpec.yaml`, toYaml(reSpec, { skipInvalid: true }));
  } catch (error) {
    console.error(`Error gathering classic runtime data:`, error);
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

    await fetchAndSaveData('gitops', namespace);
  } catch (error) {
    console.error(`Error gathering GitOps runtime data:`, error);
  }
}

async function gatherOnPrem() {
  try {
    const cf = new Codefresh();
    await cf.init();
    const accounts = await cf.getOnPremAccounts();
    const runtimes = await cf.getOnPremRuntimes();

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

    await fetchAndSaveData('onprem', namespace);

    await Deno.writeTextFile(`${dirPath}/onPremAccounts.yaml`, toYaml(accounts, { skipInvalid: true }));
    await Deno.writeTextFile(`${dirPath}/onPremRuntimes.yaml`, toYaml(runtimes, { skipInvalid: true }));
  } catch (error) {
    console.error(`Error gathering On Prem data:`, error);
  }
}

async function main() {
  try {
    const runtimeType = selectRuntimeType();

    switch (runtimeType) {
      case 'classic':
        await gatherClassic();
        break;
      case 'gitops':
        await gatherGitOps();
        break;
      case 'onprem':
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
    console.error(`Error in main function:`, error);
  }
}

await main();
