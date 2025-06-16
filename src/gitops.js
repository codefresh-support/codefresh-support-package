import { selectNamespace } from './logic/k8s.js';

export async function gitops(namespace) {
    if (!namespace) {
        const selected = await selectNamespace();
        if (!selected) {
            throw new Error('Namespace selection was cancelled or invalid.');
        }
        namespace = selected;
    }
}
