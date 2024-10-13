export class CodefreshPipelines {
  headers: { Authorization: string };
  baseURL: string;
  runtimes: any;

  constructor(headers: { Authorization: string }, baseURL: string) {
    this.headers = headers;
    this.baseURL = baseURL;
  }

  async getRuntimes() {
    try {
      const response = await fetch(`${this.baseURL}/runtime-environments`, {
        method: 'GET',
        headers: this.headers,
      });
      const runtimes = await response.json();
      this.runtimes = runtimes;
      return runtimes.map((re: { metadata: { name: string } }) => re.metadata.name);
    } catch (error) {
      console.error(error);
    }
  }
}

async function pipelines() {
  try {
    const cf = new Codefresh();
    await cf.init();
    const reNames = await cf.getAllRuntimes();
    console.log('');
    reNames.forEach((re, index) => {
      console.log(`${index + 1}. ${re}`);
    });

    let selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
    while (isNaN(selection) || selection < 1 || selection > reNames.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed runtimes.');
      selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
    }

    const reSpec = cf.runtimes[selection - 1];
    const namespace = reSpec.runtimeScheduler.cluster.namespace;

    console.log(`\nGathering Data For ${reSpec.metadata.name}.`);

    await fetchAndSaveData('Pipelines Runtime', namespace);

    await Deno.writeTextFile(`${dirPath}/runtimeSpec.yaml`, toYaml(reSpec, { skipInvalid: true }));
  } catch (error) {
    console.error(`Error gathering Pipelines Runtime data:`, error);
  }
}
