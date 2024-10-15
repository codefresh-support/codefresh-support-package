import { selectNamespace } from '../deps.ts';

export async function gitopsRuntime() {
  try {
    const namespace = await selectNamespace();
    console.log(`\nGathering Data In ${namespace} For The GitOps Runtime.`);

    await fetchAndSaveData('GitOps Runtime', namespace);

  } catch (error) {
    console.error(`Error gathering GitOps runtime data:`, error);
  }
}
