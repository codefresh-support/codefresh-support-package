import { getResources, selectNamespace } from './logic/k8s.js';
import { preparePackage, processData, writeYaml } from './logic/core.js';
import {
    getAllAccounts,
    getAllRuntimes,
    getCodefreshCredentials,
    getSystemFeatureFlags,
    getTotalUsers,
} from './logic/codefresh.js';

export async function onprem(namespace) {
    const dirPath = `./cf-support-onprem-${Math.floor(Date.now() / 1000)}`;

    const cfCreds = getCodefreshCredentials();

    if (cfCreds && cfCreds.baseUrl === 'https://g.codefresh.io/api') {
        console.log(
            'Cannot gather On-Prem data for Codefresh SaaS. If you need to gather data for Codefresh On-Prem, please update your ./cfconfig context (or Envs) to point to an On-Prem instance.',
        );
        console.log('For Codefresh SaaS, use "pipelines" or "gitops" commands.');
        return;
    }

    if (!namespace) {
        const selected = await selectNamespace();
        namespace = selected;
    }

    if (cfCreds) {
        const accounts = await getAllAccounts(cfCreds);
        writeYaml(accounts, 'OnPrem_Accounts', dirPath);
        const runtimes = await getAllRuntimes(cfCreds);
        writeYaml(runtimes, 'OnPrem_Runtimes', dirPath);
        const featureFlags = await getSystemFeatureFlags(cfCreds);
        writeYaml(featureFlags, 'OnPrem_Feature_Flags', dirPath);
        const totalUsers = await getTotalUsers(cfCreds);
        writeYaml(totalUsers, 'OnPrem_Total_Users', dirPath);
    }

    console.log(`Gathering data in the '${namespace}' namespace for Codefresh OnPrem`);
    const k8sResources = getResources(namespace);
    await processData(dirPath, k8sResources);
    await preparePackage(dirPath);
}
