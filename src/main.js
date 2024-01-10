'use strict';

import { Codefresh } from './codefresh.js';
import { autoDetectClient } from 'https://deno.land/x/kubernetes_client@v0.7.0/mod.ts';
import { BatchV1Api } from 'https://deno.land/x/kubernetes_apis@v0.5.0/builtin/batch@v1/mod.ts';
import { CoreV1Api } from 'https://deno.land/x/kubernetes_apis@v0.5.0/builtin/core@v1/mod.ts';
import { StorageV1Api } from 'https://deno.land/x/kubernetes_apis@v0.5.0/builtin/storage.k8s.io@v1/mod.ts';
import { ArgoprojIoV1alpha1Api } from 'https://deno.land/x/kubernetes_apis@v0.5.0/argo-cd/argoproj.io@v1alpha1/mod.ts';
import { compress } from 'https://deno.land/x/zip@v1.2.5/mod.ts';

console.log('Initializing \n');
const kubeConfig = await autoDetectClient();
const coreApi = new CoreV1Api(kubeConfig);
const storageApi = new StorageV1Api(kubeConfig);
const batchApi = new BatchV1Api(kubeConfig);
const argoProj = new ArgoprojIoV1alpha1Api(kubeConfig);
const timestamp = new Date().getTime();
const dirPath = `./codefresh-support-${timestamp}`;

async function saveItems(resources, dir) {
    await Deno.mkdir(`${dirPath}/${dir}/`, { recursive: true });
    return Promise.all(resources.map((item) => {
        return Deno.writeTextFile(`${dirPath}/${dir}/${item.metadata.name}.json`, JSON.stringify(item, null, 2));
    }));
}

async function gatherClassic() {
    const cf = new Codefresh();
    await cf.init();
    const reNames = await cf.getAllRuntimes();
    console.log('');
    reNames.forEach((re, index) => {
        console.log(`${index + 1}. ${re}`);
    });
    const selection = prompt('\nWhich Classic Runtime Are We Working With? (Number): ');
    const reSpec = cf.runtimes[selection - 1];
    const namespace = reSpec.runtimeScheduler.cluster.namespace;

    console.log(`\nGathering Data For ${reSpec.metadata.name}.`);

    const dataFetchers = {
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

    for (const [dir, fetcher] of Object.entries(dataFetchers)) {
        const resources = await fetcher();
        if (dir === 'Pods') {
            await saveItems(resources.items, dir);
            await Promise.all(resources.items.map(async (item) => {
                const log = await coreApi.namespace(namespace).getPodLog(item.metadata.name, { container: item.spec.containers[0].name });
                return Deno.writeTextFile(`${dirPath}/${dir}/${item.metadata.name}.log`, log);
            }));
        } else {
            await saveItems(resources.items, dir);
        }
    }

    Deno.writeTextFile(`${dirPath}/runtimeSpec.json`, JSON.stringify(reSpec, null, 2));
}

async function gatherGitOps() {
    const namespaceList = await coreApi.getNamespaceList();
    console.log('');
    namespaceList.items.forEach((ns, index) => {
        console.log(`${index + 1}. ${ns.metadata.name}`);
    });
    const selection = prompt('\nWhich Namespace Is The GitOps Runtime Installed In? (Number): ');
    const namespace = namespaceList.items[selection - 1].metadata.name;

    const apps = await argoProj.namespace(namespace).getApplicationList();
    const isCodfresh = apps.items.some((app) => ['codefresh.io/entity'] in app.metadata.labels);

    if (!isCodfresh) {
        const continueData = confirm(`\nCould not find a GitOps Runtime in ${namespace}. Do you still want to continue?`);
        if (!continueData) {
            return;
        }
    }

    console.log(`\nGathering Data In ${namespace} For The GitOps Runtime.`);

    const dataFetchers = {
        'Apps': () => argoProj.namespace(namespace).getApplicationList(),
        'Nodes': () => coreApi.getNodeList(),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList(),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Events': () => coreApi.namespace(namespace).getEventList(),
    };

    for (const [dir, fetcher] of Object.entries(dataFetchers)) {
        const resources = await fetcher();
        if (dir === 'Pods') {
            await saveItems(resources.items, dir);
            await Promise.all(resources.items.map(async (item) => {
                const log = await coreApi.namespace(namespace).getPodLog(item.metadata.name, { container: item.spec.containers[0].name });
                return Deno.writeTextFile(`${dirPath}/${dir}/${item.metadata.name}.log`, log);
            }));
        } else {
            await saveItems(resources.items, dir);
        }
    }
}

function selectRuntimeType() {
    const reTypes = ['classic', 'gitops'];
    reTypes.forEach((reType, index) => {
        console.log(`${index + 1}. ${reType}`);
    });
    const typeSelected = prompt('\nWhich Type Of Runtime Are We Using? (Number):');
    return reTypes[typeSelected - 1];
}

async function main() {
    const runtimeType = selectRuntimeType();

    switch (runtimeType) {
        case 'classic':
            await gatherClassic();
            break;
        case 'gitops':
            await gatherGitOps();
            break;
        default:
            console.log('Invalid runtime type selected');
            return;
    }

    console.log(`\nSaving data to ./codefresh-support-package-${timestamp}.zip`);
    await compress(dirPath, `./codefresh-support-package-${timestamp}.zip`, { overwrite: true });

    console.log('\nCleaning up temp directory');
    await Deno.remove(dirPath, { recursive: true });
    console.log(`\nPlease attach ./codefresh-support-package-${timestamp}.zip to your support ticket.`);
    console.log('Before attaching, verify the contents and remove any sensitive information.');
}

await main();
