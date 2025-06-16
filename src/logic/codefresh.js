import { parse } from '@std/yaml';

export function getCodefreshCredentials() {
    const envToken = Deno.env.get('CF_API_KEY');
    const envUrl = Deno.env.get('CF_BASE_URL');

    if (envToken && envUrl) {
        return {
            headers: { Authorization: envToken },
            baseUrl: `${envUrl}/api`,
        };
    }

    const configPath = Deno.build.os === 'windows'
        ? `${Deno.env.get('USERPROFILE')}/.cfconfig`
        : `${Deno.env.get('HOME')}/.cfconfig`;

    const configFileContent = Deno.readTextFileSync(configPath);
    const config = parse(configFileContent);
    const currentContext = config.contexts[config['current-context']];

    if (!currentContext) {
        throw new Error('Current context not found in Codefresh config.');
    }

    return {
        headers: { Authorization: currentContext.token },
        baseUrl: `${currentContext.url}/api`,
    };
}

export async function getAccountRuntimes(cfCreds) {
    const response = await fetch(`${cfCreds.baseUrl}/runtime-environments`, {
        method: 'GET',
        headers: cfCreds.headers,
    });
    const runtimes = await response.json();
    return runtimes;
}

export async function getRuntimeSpec(cfCreds, runtime) {
    const response = await fetch(`${cfCreds.baseUrl}/runtime-environments/${encodeURIComponent(runtime)}`, {
        method: 'GET',
        headers: cfCreds.headers,
    });
    const runtimeSpec = await response.json();
    return runtimeSpec;
}

export async function getAllAccounts(cfCreds) {
    const response = await fetch(`${cfCreds.baseUrl}/admin/accounts`, {
        method: 'GET',
        headers: cfCreds.headers,
    });
    const accounts = await response.json();
    return accounts;
}

export async function getAllRuntimes(cfCreds) {
    const response = await fetch(`${cfCreds.baseUrl}/admin/runtime-environments`, {
        method: 'GET',
        headers: cfCreds.headers,
    });
    const onPremRuntimes = await response.json();
    return onPremRuntimes;
}

export async function getTotalUsers(cfCreds) {
    const response = await fetch(`${cfCreds.baseUrl}/admin/user?limit=1&page=1`, {
        method: 'GET',
        headers: cfCreds.headers,
    });
    const users = await response.json();
    return users.total;
}

export async function getSystemFeatureFlags(cfCreds) {
    const response = await fetch(`${cfCreds.baseUrl}/admin/features`, {
        method: 'GET',
        headers: cfCreds.headers,
    });
    const onPremSystemFF = await response.json();
    return onPremSystemFF;
}
