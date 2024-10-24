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
  const response = await fetch(`${config.baseUrl}/admin/users?limit=1&page=1`, {
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
    console.error(`Error gathering GitOps runtime data:`, error);
  }
}
