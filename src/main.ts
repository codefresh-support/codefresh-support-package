import { getUserRuntimeSelection, RuntimeType } from './deps.ts';

async function main() {
  try {
    const runtimeTypes = Object.values(RuntimeType);
    const typeSelected = getUserRuntimeSelection(runtimeTypes);

    switch (runtimeTypes[typeSelected - 1]) {
      case RuntimeType.pipelines:
        // await pipelines();
        console.log('Pipelines Runtime');
        break;
      case RuntimeType.gitops:
        // await gitops();
        console.log('GitOps Runtime');
        break;
      case RuntimeType.onprem:
        // await onprem();
        console.log('On-Prem Runtime');
        break;
    }
  } catch (error) {
    console.error(`Error:`, error);
  }
}

await main();
