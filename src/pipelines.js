import { getResources, selectNamespace } from './logic/k8s.js';
import { preparePackage, processData, writeYaml } from './logic/core.js';
import { getAccountRuntimes, getCodefreshCredentials, getRuntimeSpec } from './logic/codefresh.js';

export async function pipelines(namespace, runtime) {
    const dirPath = `./cf-support-gitops-${Math.floor(Date.now() / 1000)}`;
    const cfCreds = getCodefreshCredentials();

    if (!namespace) {
        const selected = await selectNamespace();
        namespace = selected;
    }

    if (cfCreds) {
        if (!runtime) {
            const runtimes = await getAccountRuntimes(cfCreds);

            if (runtimes.length !== 0) {
                runtimes.forEach((re, index) => {
                    console.log(`${index + 1}. ${re.metadata.name}`);
                });
                let selection;
                do {
                    selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
                    if (isNaN(selection) || selection < 1 || selection > runtimes.length) {
                        console.log(
                            'Invalid selection. Please enter a number corresponding to one of the listed runtimes.',
                        );
                    }
                } while (isNaN(selection) || selection < 1 || selection > runtimes.length);

                reSpec = runtimes[selection - 1];
                writeYaml(reSpec, 'Runtime_Spec', dirPath);
            }
        } else {
            reSpec = getRuntimeSpec(cfCreds, runtime);
            writeYaml(reSpec, 'Runtime_Spec', dirPath);
        }
    }

    console.log(`Gathering data in the '${namespace}' namespace for Codefresh OnPrem`);
    const k8sResources = getResources(namespace);
    await processData(dirPath, k8sResources);
    await preparePackage(dirPath);
}
