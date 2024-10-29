import { fetchAndSaveData, prepareAndCleanup, RuntimeType, selectNamespace, writeCodefreshFiles } from '../deps.ts';

async function getAllAccounts(config: { headers: { Authorization: string }; baseUrl: string }) {
  const response = await fetch(`${config.baseUrl}/admin/accounts`, {
    method: 'GET',
    headers: config.headers,
  });
  const accounts = await response.json();
  await writeCodefreshFiles(accounts, 'onPrem-accounts');
}

async function getAllRuntimes(config: { headers: { Authorization: string }; baseUrl: string }) {
  const response = await fetch(`${config.baseUrl}/admin/runtime-environments`, {
    method: 'GET',
    headers: config.headers,
  });
  const onPremRuntimes = await response.json();
  await writeCodefreshFiles(onPremRuntimes, 'onPrem-runtimes');
}

async function getTotalUsers(config: { headers: { Authorization: string }; baseUrl: string }) {
  const response = await fetch(`${config.baseUrl}/admin/user?limit=1&page=1`, {
    method: 'GET',
    headers: config.headers,
  });
  const users = await response.json();
  await writeCodefreshFiles({ total: users.total }, 'onPrem-totalUsers');
}

async function getSystemFeatureFlags(config: { headers: { Authorization: string }; baseUrl: string }) {
  const response = await fetch(`${config.baseUrl}/admin/features`, {
    method: 'GET',
    headers: config.headers,
  });
  const onPremSystemFF = await response.json();
  await writeCodefreshFiles(onPremSystemFF, 'onPrem-systemFeatureFlags');
}

export async function onPrem(config: { headers: { Authorization: string }; baseUrl: string }) {
  if (config.baseUrl === 'https://g.codefresh.io/api') {
    console.error(
      `\nCannot gather On-Prem data for Codefresh SaaS. Please select either ${RuntimeType.pipelines} or ${RuntimeType.gitops}.`,
    );
    console.error(
      'If you need to gather data for Codefresh On-Prem, please update your ./cfconfig conext (or Envs) to point to an On-Prem instance.',
    );
    Deno.exit(40);
  }
  try {
    const namespace = await selectNamespace();
    console.log(`\nGathering data in "${namespace}" namespace for Codefresh On-Prem.`);
    await fetchAndSaveData(RuntimeType.onprem, namespace);
    await Promise.all([
      getAllAccounts(config),
      getAllRuntimes(config),
      getTotalUsers(config),
      getSystemFeatureFlags(config),
    ]);
    console.log('\nData Gathered Successfully.');
    await prepareAndCleanup();
  } catch (error) {
    console.error(`Error gathering On-Prem data:`, error);
  }
}
