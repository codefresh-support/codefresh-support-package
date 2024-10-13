export class CodefreshOnPrem {
  headers: { Authorization: string };
  baseURL: string;

  constructor(headers: { Authorization: string }, baseURL: string) {
    this.headers = headers;
    this.baseURL = baseURL;
  }

  async getAllAccounts() {
    try {
      const response = await fetch(`${this.baseURL}/admin/accounts`, {
        method: 'GET',
        headers: this.headers,
      });
      const accounts = await response.json();
      return accounts;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async getAllRuntimes() {
    try {
      const response = await fetch(`${this.baseURL}/admin/runtime-environments`, {
        method: 'GET',
        headers: this.headers,
      });
      const onPremRuntimes = await response.json();
      return onPremRuntimes;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async getTotalUsers() {
    try {
      const response = await fetch(`${this.baseURL}/admin/users?limit=1&page=1`, {
        method: 'GET',
        headers: this.headers,
      });
      const users = await response.json();
      return users.total;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async getSystemFeatureFlags() {
    try {
      const response = await fetch(`${this.baseURL}/admin/features`, {
        method: 'GET',
        headers: this.headers,
      });
      const onPremSystemFF = await response.json();
      return onPremSystemFF;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}

async function onprem() {
  try {
    const cf = new Codefresh();
    await cf.init();
    if (cf.apiURL === 'https://g.codefresh.io') {
      console.error(`The API URL ( ${cf.apiURL} ) is not an On Prem instance. Please use Pipelines Runtime or GitOps Runtime.`);
      Deno.exit(1);
    }
    const accounts = await cf.getOnPremAccounts();
    const runtimes = await cf.getOnPremRuntimes();
    const userTotal = await cf.getOnPremUserTotal();
    const systemFF = await cf.getOnPremSystemFF();

    const namespaceList = await coreApi.getNamespaceList();
    console.log('');
    namespaceList.items.forEach((ns, index) => {
      console.log(`${index + 1}. ${ns.metadata.name}`);
    });

    let selection = Number(prompt('\nWhich Namespace Is Codefresh OnPrem Installed In? (Number): '));
    while (isNaN(selection) || selection < 1 || selection > namespaceList.items.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed namespaces.');
      selection = Number(prompt('\nWhich Namespace Is Codefresh OnPrem Installed In? (Number): '));
    }

    const namespace = namespaceList.items[selection - 1].metadata.name;

    console.log(`\nGathering Data For On Prem.`);

    await fetchAndSaveData('On-Prem', namespace);

    await Deno.writeTextFile(`${dirPath}/onPremAccounts.yaml`, toYaml(accounts, { skipInvalid: true }));
    await Deno.writeTextFile(`${dirPath}/onPremRuntimes.yaml`, toYaml(runtimes, { skipInvalid: true }));
    await Deno.writeTextFile(`${dirPath}/onPremUserTotal.txt`, userTotal.toString());
    await Deno.writeTextFile(`${dirPath}/onPremSystemFF.yaml`, toYaml(systemFF, { skipInvalid: true }));
  } catch (error) {
    console.error(`Error gathering On Prem data:`, error);
  }
}
