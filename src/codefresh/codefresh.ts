import { parse } from '../deps.ts';

enum ContextKeys {
  Token = 'token',
  Url = 'url',
}

interface Context {
  [ContextKeys.Token]: string;
  [ContextKeys.Url]: string;
}

interface CodefreshConfig {
  contexts: {
    [key: string]: Context;
  };
  'current-context': string;
}

async function readConfigFile() {
  const configPath = Deno.build.os === 'windows' ? `${Deno.env.get('USERPROFILE')}/.cfconfig` : `${Deno.env.get('HOME')}/.cfconfig`;
  const configFileContent = await Deno.readTextFile(configPath);
  return parse(configFileContent) as CodefreshConfig;
}

async function getCodefreshCredentials(envVar: string, configKey: ContextKeys) {
  const envValue = Deno.env.get(envVar);
  if (envValue) {
    return envValue;
  }

  try {
    const cfConfig = await readConfigFile();
    return cfConfig.contexts[cfConfig['current-context']][configKey];
  } catch (error) {
    console.error('Failed to get Codefresh credentials:', error);
    console.error('Please set the environment variables (CF_API_KEY and CF_BASE_URL) or make sure you have a valid Codefresh config file.');
    Deno.exit(10);
  }
}

export async function autoDetectCodefreshClient() {
  const headers = {
    Authorization: await getCodefreshCredentials('CF_API_KEY', ContextKeys.Token),
  };
  const baseUrl = `${await getCodefreshCredentials('CF_BASE_URL', ContextKeys.Url)}/api`;
  return { headers, baseUrl };
}
