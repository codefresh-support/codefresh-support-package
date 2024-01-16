'use strict';
import { parse } from 'https://deno.land/std@0.211.0/yaml/mod.ts';

class Codefresh {
  async init() {
    this.apiKey = await this.getEnvVarOrConfig('CF_API_KEY', 'token');
    this.apiURL = await this.getEnvVarOrConfig('CF_URL', 'url');

    this.headers = {
      Authorization: this.apiKey,
    };
    this.baseURL = this.apiURL + `/api`;
  }

  async getEnvVarOrConfig(envVar, configKey) {
    if (Deno.env.has(envVar)) {
      return Deno.env.get(envVar);
    } else {
      try {
        let cfConfig;
        if (Deno.build.os === 'windows') {
          cfConfig = parse(await Deno.readTextFile(`${Deno.env.get('USERPROFILE')}/.cfconfig`));
        } else {
          cfConfig = parse(await Deno.readTextFile(`${Deno.env.get('HOME')}/.cfconfig`));
        }

        return cfConfig.contexts[cfConfig['current-context']][configKey];
      } catch (error) {
        console.error(error);
      }
    }
  }

  async getAllRuntimes() {
    try {
      const response = await fetch(`${this.baseURL}/runtime-environments`, {
        method: 'GET',
        headers: this.headers,
      });
      const runtimes = await response.json();
      this.runtimes = runtimes;
      return runtimes.map((re) => re.metadata.name);
    } catch (error) {
      console.error(error);
    }
  }

  async getOnPremAccounts() {
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

  async getOnPremRuntimes() {
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
}

export { Codefresh };
