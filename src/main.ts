import { autoDetectCodefreshClient, getUserRuntimeSelection, gitopsRuntime, onPrem, pipelinesRuntime, RuntimeType } from './deps.ts';

async function main() {
  try {
    const runtimeTypes = Object.values(RuntimeType);
    const runtimeSelected = getUserRuntimeSelection(runtimeTypes);
    const cfConfig = await autoDetectCodefreshClient();

    switch (runtimeSelected) {
      case RuntimeType.pipelines:
        await pipelinesRuntime(cfConfig);
        break;
      case RuntimeType.gitops:
        await gitopsRuntime();
        break;
      case RuntimeType.onprem:
        await onPrem(cfConfig);
        break;
    }
  } catch (error) {
    console.error(`Error:`, error);
  }
}

await main();
