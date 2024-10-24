import { fetchAndSaveData, prepareAndCleanup, RuntimeType, writeCodefreshFiles } from '../deps.ts';

async function getRuntimes(config: { headers: { Authorization: string }; baseUrl: string }) {
  const response = await fetch(`${config.baseUrl}/runtime-environments`, {
    method: 'GET',
    headers: config.headers,
  });
  const runtimes = await response.json();
  return runtimes;
}

export async function pipelinesRuntime(config: { headers: { Authorization: string }; baseUrl: string }) {
  try {
    const runtimes = await getRuntimes(config);
    console.log('');
    runtimes.forEach((re: any, index: number) => {
      console.log(`${index + 1}. ${re.metadata.name}`);
    });

    let selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
    while (isNaN(selection) || selection < 1 || selection > runtimes.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed runtimes.');
      selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
    }

    const reSpec = runtimes[selection - 1];
    const namespace = reSpec.runtimeScheduler.cluster.namespace;

    console.log(`\nGathering Data For ${reSpec.metadata.name} in the "${namespace}" namespace.`);
    await fetchAndSaveData(RuntimeType.pipelines, namespace);
    await writeCodefreshFiles(reSpec, 'pipelines-runtime');
    console.log('\nData Gathered Successfully.');
    await prepareAndCleanup();
  } catch (error) {
    console.error(`Error gathering Pipelines Runtime data:`, error);
  }
}
