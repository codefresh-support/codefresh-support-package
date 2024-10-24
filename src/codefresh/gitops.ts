import { fetchAndSaveData, prepareAndCleanup, RuntimeType, selectNamespace } from '../deps.ts';

export async function gitopsRuntime() {
  try {
    const namespace = await selectNamespace();
    console.log(`\nGathering data in "${namespace}" namespace for the GitOps Runtime.`);
    await fetchAndSaveData(RuntimeType.gitops, namespace);
    console.log('\nData Gathered Successfully.');
    await prepareAndCleanup();
  } catch (error) {
    console.error(`Error gathering GitOps runtime data:`, error);
  }
}
