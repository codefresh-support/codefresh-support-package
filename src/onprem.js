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
    const dirPath = `./cf-support-onprem-${new Date().toISOString().replace(/[:.]/g, '-').replace(/\.\d{3}Z$/, 'Z')}`;

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
        const dataFetchers = [
            { name: 'OnPrem_Accounts', fetcher: getAllAccounts },
            { name: 'OnPrem_Runtimes', fetcher: getAllRuntimes },
            { name: 'OnPrem_Feature_Flags', fetcher: getSystemFeatureFlags },
            { name: 'OnPrem_Total_Users', fetcher: getTotalUsers },
        ];

        for (const { name, fetcher } of dataFetchers) {
            try {
                const data = await fetcher(cfCreds);
                await writeYaml(data, name, dirPath);
            } catch (error) {
                console.error(`Failed to fetch or write ${name}:`, error.message);
            }
        }
    }

    console.log(`Gathering data in the '${namespace}' namespace for Codefresh OnPrem`);
    const k8sResources = getResources(namespace);
    await processData(dirPath, k8sResources);
    await preparePackage(dirPath);
}
