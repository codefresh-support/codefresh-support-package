import { getResources, selectNamespace } from './logic/k8s.js';
import { preparePackage, processData } from './logic/core.js';

export async function gitops(namespace) {
    const dirPath = `./cf-support-gitops-${new Date().toISOString().replace(/[:.]/g, '-').replace(/\..*Z/, 'Z')}`;

    if (!namespace) {
        const selected = await selectNamespace();
        namespace = selected;
    }

    console.log(`Gathering data in the '${namespace}' namespace for the GitOps Runtime`);
    const k8sResources = getResources(namespace);
    await processData(dirPath, k8sResources);
    await preparePackage(dirPath);
}
