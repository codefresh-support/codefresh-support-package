import { getResources, selectNamespace } from './logic/k8s.js';
import { preparePackage, processData } from './logic/core.js';

export async function gitops(namespace) {
    const dirPath = `./cf-support-gitops-${Math.floor(Date.now() / 1000)}`;

    if (!namespace) {
        const selected = await selectNamespace();
        namespace = selected;
    }

    console.log(`Gatheing data in the '${namespace}' namespace for the GitOps Runtime`);
    const k8sResources = getResources(namespace);
    await processData(dirPath, k8sResources);
    await preparePackage(dirPath);
}
