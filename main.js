'use strict';
import { compress } from '@fakoua/zip-ts';
import { parse, stringify as toYaml } from '@std/yaml';
import { getSemaphore } from '@henrygd/semaphore';

const VERSION = '__APP_VERSION__';

const cfRuntimeTypes = {
  pipelines: 'Pipelines Runtime',
  gitops: 'GitOps Runtime',
  onprem: 'On-Prem',
};

const timestamp = new Date().getTime();
const dirPath = `./codefresh-support-${timestamp}`;
const supportPackageZip = `./codefresh-support-package-${timestamp}.zip`;
const numOfProcesses = 5;

// ##############################
// KUBERNETES
// ##############################

const k8sResourceTypes = [
  'Applications',
  'ApplicationSets',
  'Configmaps',
  'CronJobs',
  'DaemonSets',
  'Deployments',
  'Jobs',
  'Nodes',
  'PersistentVolumeClaims',
  'PersistentVolumes',
  'Pods',
  'ServiceAccounts',
  'Services',
  'StatefulSets',
  'Storageclass',
];

async function getK8sNamespace() {
  const namespaces = new Deno.Command('kubectl', {
    args: ['get', 'namespaces', '-o', 'jsonpath={.items[*].metadata.name}'],
  });
  const result = await namespaces.output();

  if (result.stderr.length > 0) {
    console.error('Unable to get namespaces:');
    throw new Error(new TextDecoder().decode(result.stderr));
  }

  const namespaceList = new TextDecoder().decode(result.stdout).split(' ');
  namespaceList.forEach((namespace, index) => {
    console.log(`${index + 1}. ${namespace}`);
  });

  let selection;
  do {
    selection = Number(prompt('\nWhich Namespace Is Codefresh Installed In? (Number): '));
    if (isNaN(selection) || selection < 1 || selection > namespaceList.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed namespaces.');
    }
  } while (isNaN(selection) || selection < 1 || selection > namespaceList.length);

  return namespaceList[selection - 1];
}

async function getK8sResources(k8sType, namespace, labelSelector) {
  try {
    const cmdList = new Deno.Command('kubectl', {
      args: ['get', k8sType.toLowerCase(), '-n', namespace, '-l', labelSelector],
    });
    const cmdJSON = new Deno.Command('kubectl', {
      args: ['get', k8sType.toLowerCase(), '-n', namespace, '-l', labelSelector, '-o', 'json'],
    });
    const cmdListResult = await cmdList.output();
    const cmdJSONResult = await cmdJSON.output();
    return {
      resourceList: new TextDecoder().decode(
        cmdListResult.stderr.length > 0 ? cmdListResult.stderr : cmdListResult.stdout,
      ),
      resourceJSON: JSON.parse(
        new TextDecoder().decode(cmdJSONResult.stderr.length > 0 ? cmdJSONResult.stderr : cmdJSONResult.stdout),
      ),
    };
  } catch (error) {
    throw new Error(`Error getting ${k8sType} resources:`, error);
  }
}

async function getK8sEvents(namespace) {
  try {
    const events = new Deno.Command('kubectl', {
      args: ['get', 'events', '-n', namespace, '--sort-by=.metadata.creationTimestamp'],
    });
    const result = await events.output();
    return new TextDecoder().decode(result.stderr.length > 0 ? result.stderr : result.stdout);
  } catch (error) {
    throw new Error('Error getting k8s events:', error);
  }
}

async function describeK8sResources(k8sType, namespace, resourceName) {
  try {
    const describe = new Deno.Command('kubectl', {
      args: ['describe', k8sType.toLowerCase(), '-n', namespace, resourceName],
    });
    const result = await describe.output();
    return new TextDecoder().decode(result.stderr.length > 0 ? result.stderr : result.stdout);
  } catch (error) {
    throw new Error(`Error describing ${k8sType} resource:`, error);
  }
}

async function getK8sLogs(namespace, podName, containerName) {
  try {
    const logs = new Deno.Command('kubectl', {
      args: ['logs', '-n', namespace, podName, '-c', containerName],
    });
    const result = await logs.output();
    return new TextDecoder().decode(result.stderr.length > 0 ? result.stderr : result.stdout);
  } catch (error) {
    throw new Error(`Error getting logs for ${podName} - ${containerName}:`, error);
  }
}

// ##############################
// CODEFRESH
// ##############################

async function getCodefreshCredentials() {
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

  const configFileContent = await Deno.readTextFile(configPath);
  const config = parse(configFileContent);
  const currentContext = config.contexts?.[config['current-context']];

  if (!currentContext) {
    throw new Error('Current context not found in Codefresh config.');
  }

  return {
    headers: { Authorization: currentContext.token },
    baseUrl: `${currentContext.url}/api`,
  };
}

function getUserRuntimeSelection() {
  const runtimes = Object.values(cfRuntimeTypes);

  runtimes.forEach((runtimeName, index) => {
    console.log(`${index + 1}. ${runtimeName}`);
  });

  let selection;
  do {
    selection = Number(prompt('\nWhich Type Of Runtime Are We Using? (Enter the number):'));
    if (isNaN(selection) || selection < 1 || selection > runtimes.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed options.');
    }
  } while (isNaN(selection) || selection < 1 || selection > runtimes.length);

  return runtimes[selection - 1];
}

// ##############################
// CODEFRESH PIPELINES
// ##############################
async function getAccountRuntimes(cfConfig) {
  const response = await fetch(`${cfConfig.baseUrl}/runtime-environments`, {
    method: 'GET',
    headers: cfConfig.headers,
  });
  const runtimes = await response.json();
  return runtimes;
}

async function runTestPipeline(cfConfig, runtimeName) {
  let selection = String(
    prompt(
      '\nTo troubleshoot, we would like to create a Demo Pipeline and run it.\nAfter creating this pipeline we will clean up the resources\n\nWould you like to proceed with the demo pipeline? (y/n): ',
    ),
  );
  while (selection !== 'y' && selection !== 'n') {
    console.log('Invalid selection. Please enter "y" or "n".');
    selection = String(prompt('\nWould you like to proceed with the demo pipeline? (y/n): '));
  }
  if (selection === 'n') {
    return;
  }

  console.log(`\nCreating a demo pipeline to test the ${runtimeName} runtime.`);

  const projectName = 'CODEFRESH-SUPPORT-PACKAGE';
  const pipelineName = 'TEST-PIPELINE-FOR-SUPPORT';
  const pipelineYaml =
    'version: "1.0"\n\nsteps:\n\n  test:\n    title: Running test\n    type: freestyle\n    arguments:\n      image: alpine\n      commands:\n        - echo "Hello Test"';

  const project = JSON.stringify({
    projectName: projectName,
  });

  const pipeline = JSON.stringify({
    version: '1.0',
    kind: 'pipeline',
    metadata: {
      name: `${projectName}/${pipelineName}`,
      project: projectName,
      originalYamlString: pipelineYaml,
    },
    spec: {
      concurrency: 1,
      runtimeEnvironment: {
        name: runtimeName,
      },
    },
  });

  const createProjectResponse = await fetch(`${cfConfig.baseUrl}/projects`, {
    method: 'POST',
    headers: {
      ...cfConfig.headers,
      'Content-Type': 'application/json',
    },
    body: project,
  });

  const projectStatus = await createProjectResponse.json();

  if (!createProjectResponse.ok) {
    console.error('Error creating project:', createProjectResponse.statusText);
    console.error(projectStatus);
    const getProjectID = await fetch(`${cfConfig.baseUrl}/projects/name/${projectName}`, {
      method: 'GET',
      headers: cfConfig.headers,
    });
    const projectResponse = await getProjectID.json();
    projectStatus.id = projectResponse.id;
  }

  const createPipelineResponse = await fetch(`${cfConfig.baseUrl}/pipelines`, {
    method: 'POST',
    headers: {
      ...cfConfig.headers,
      'Content-Type': 'application/json',
    },
    body: pipeline,
  });

  const pipelineStatus = await createPipelineResponse.json();

  if (!createPipelineResponse.ok) {
    try {
      console.error('Error creating pipeline:', createPipelineResponse.statusText);
      console.error(pipelineStatus);
      const getPipelineID = await fetch(`${cfConfig.baseUrl}/pipelines/${projectName}%2f${pipelineName}`, {
        method: 'GET',
        headers: cfConfig.headers,
      });
      const pipelineResponse = await getPipelineID.json();
      pipelineStatus.metadata = {};
      pipelineStatus.metadata.id = pipelineResponse.metadata.id;
      pipelineResponse.spec.runtimeEnvironment = pipelineResponse.spec.runtimeEnvironment || {};
      pipelineResponse.spec.runtimeEnvironment.name = runtimeName;

      await fetch(`${cfConfig.baseUrl}/pipelines/${projectName}%2f${pipelineName}`, {
        method: 'PUT',
        headers: {
          ...cfConfig.headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pipelineResponse),
      });
    } catch (error) {
      throw new Error('Error getting / updating pipeline:', error);
    }
  }

  const runPipelineResponse = await fetch(`${cfConfig.baseUrl}/pipelines/run/${pipelineStatus.metadata.id}`, {
    method: 'POST',
    headers: {
      ...cfConfig.headers,
      'Content-Type': 'application/json',
    },
  });

  const runPipelineStatus = await runPipelineResponse.json();

  if (!runPipelineResponse.ok) {
    try {
      console.error('Error running pipeline:', runPipelineResponse.statusText);
      console.error(runPipelineStatus);
      return { pipelineID: pipelineStatus.metadata.id, projectID: projectStatus.id };
    } catch (error) {
      throw new Error('Error running pipeline:', error);
    }
  }

  console.log(`\nDemo pipeline created and running build with id of ${runPipelineStatus}.`);

  // Wait 30 seconds to allow the pipeline to run
  await new Promise((resolve) => setTimeout(resolve, 30000));

  return { pipelineID: pipelineStatus.metadata.id, projectID: projectStatus.id, buildID: runPipelineStatus };
}

async function deleteTestPipeline(cfConfig, pipelineID, projectID) {
  const deletePipelineResponse = await fetch(`${cfConfig.baseUrl}/pipelines/${pipelineID}`, {
    method: 'DELETE',
    headers: cfConfig.headers,
  });

  if (!deletePipelineResponse.ok) {
    throw new Error('Error deleting pipeline:', await deletePipelineResponse.text());
  }

  const deleteProjectResponse = await fetch(`${cfConfig.baseUrl}/projects/${projectID}`, {
    method: 'DELETE',
    headers: cfConfig.headers,
  });

  if (!deleteProjectResponse.ok) {
    throw new Error('Error deleting project:', await deleteProjectResponse.text());
  }

  console.log('Demo pipeline and project deleted successfully.');
}

async function gatherPipelinesRuntime(cfConfig) {
  try {
    const runtimes = await getAccountRuntimes(cfConfig);
    console.log('');
    runtimes.forEach((re, index) => {
      console.log(`${index + 1}. ${re.metadata.name}`);
    });

    let namespace;
    let reSpec;
    let pipelineExecutionOutput;

    if (runtimes.length !== 0) {
      let selection;
      do {
        selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
        if (isNaN(selection) || selection < 1 || selection > runtimes.length) {
          console.log('Invalid selection. Please enter a number corresponding to one of the listed runtimes.');
        }
      } while (isNaN(selection) || selection < 1 || selection > runtimes.length);

      reSpec = runtimes[selection - 1];
      namespace = reSpec.runtimeScheduler.cluster.namespace;

      pipelineExecutionOutput = await runTestPipeline(cfConfig, reSpec.metadata.name);
    } else {
      console.log('No Pipelines Runtimes found in the account.');
      namespace = await getK8sNamespace();
    }

    console.log(
      `\nGathering Data For ${reSpec?.metadata.name ?? 'Pipelines Runtime'} in the "${namespace}" namespace.`,
    );

    await fetchAndSaveData(namespace);

    if (reSpec) {
      await writeCodefreshFiles(reSpec, 'pipelines-runtime-spec');
    }

    console.log('\nData Gathered Successfully.');

    if (pipelineExecutionOutput) {
      await Deno.writeTextFile(`${dirPath}/testPipelineBuildId.txt`, pipelineExecutionOutput.buildID);
      await deleteTestPipeline(cfConfig, pipelineExecutionOutput.pipelineID, pipelineExecutionOutput.projectID);
    }

    await prepareAndCleanup();
  } catch (error) {
    throw new Error('Error gathering Pipelines Runtime data:', error);
  }
}

// ##############################
// CODEFRESH GITOPS
// ##############################
async function gatherGitopsRuntime() {
  try {
    const namespace = await getK8sNamespace();
    console.log(`\nGathering data in "${namespace}" namespace for the GitOps Runtime.`);
    await fetchAndSaveData(namespace);
    console.log('\nData Gathered Successfully.');
    await prepareAndCleanup();
  } catch (error) {
    throw new Error(`Error gathering GitOps runtime data:`, error);
  }
}
// ##############################
// CODEFRESH ONPREM
// ##############################
async function getAllAccounts(cfConfig) {
  const response = await fetch(`${cfConfig.baseUrl}/admin/accounts`, {
    method: 'GET',
    headers: cfConfig.headers,
  });
  const accounts = await response.json();
  await writeCodefreshFiles(accounts, 'onPrem-accounts');
}

async function getAllRuntimes(cfConfig) {
  const response = await fetch(`${cfConfig.baseUrl}/admin/runtime-environments`, {
    method: 'GET',
    headers: cfConfig.headers,
  });
  const onPremRuntimes = await response.json();
  await writeCodefreshFiles(onPremRuntimes, 'onPrem-runtimes');
}

async function getTotalUsers(cfConfig) {
  const response = await fetch(`${cfConfig.baseUrl}/admin/user?limit=1&page=1`, {
    method: 'GET',
    headers: cfConfig.headers,
  });
  const users = await response.json();
  await writeCodefreshFiles({ total: users.total }, 'onPrem-totalUsers');
}

async function getSystemFeatureFlags(cfConfig) {
  const response = await fetch(`${cfConfig.baseUrl}/admin/features`, {
    method: 'GET',
    headers: cfConfig.headers,
  });
  const onPremSystemFF = await response.json();
  await writeCodefreshFiles(onPremSystemFF, 'onPrem-systemFeatureFlags');
}

async function gatherOnPrem(cfConfig) {
  if (cfConfig.baseUrl === 'https://g.codefresh.io/api') {
    console.error(
      `\nCannot gather On-Prem data for Codefresh SaaS. Please select either ${cfRuntimeTypes.pipelines} or ${cfRuntimeTypes.gitops}.\n If you need to gather data for Codefresh On-Prem, please update your ./cfconfig context (or Envs) to point to an On-Prem instance.`,
    );
    throw new Error('Invalid Codefresh On-Prem URL.');
  }

  try {
    const namespace = await getK8sNamespace();
    console.log(`\nGathering data in "${namespace}" namespace for Codefresh On-Prem.`);

    await fetchAndSaveData(namespace);

    await Promise.all([
      getAllAccounts(cfConfig),
      getAllRuntimes(cfConfig),
      getTotalUsers(cfConfig),
      getSystemFeatureFlags(cfConfig),
    ]);

    console.log('\nData Gathered Successfully.');
    await prepareAndCleanup();
  } catch (error) {
    throw new Error(`Error gathering On-Prem data: ${error.message}`);
  }
}

// ##############################
// HELPER FUNCTIONS
// ##############################

async function writeCodefreshFiles(data, name) {
  const filePath = `${dirPath}/${name}.yaml`;
  const fileContent = toYaml(data, { skipInvalid: true });
  await Deno.writeTextFile(filePath, fileContent);
}

async function writeGetApiCalls(resources, k8sType) {
  const sem = getSemaphore(k8sType, numOfProcesses);
  await Promise.all(resources.map(async (item) => {
    await sem.acquire();
    try {
      const filePath = `${dirPath}/${k8sType}/${item.metadata.name}.yaml`;
      const fileContent = toYaml(item, { skipInvalid: true });
      await Deno.writeTextFile(filePath, fileContent);
    } finally {
      sem.release();
    }
  }));
}

async function prepareAndCleanup() {
  console.log(`Saving data to ${supportPackageZip}`);
  await compress(dirPath, `${supportPackageZip}`, { overwrite: true });

  console.log('Cleaning up temp directory');
  await Deno.remove(dirPath, { recursive: true });

  console.log(`\nPlease attach ${supportPackageZip} to your support ticket.`);
}

async function fetchAndSaveData(namespace) {
  for (const k8sType of k8sResourceTypes) {
    await Deno.mkdir(`${dirPath}/${k8sType}/`, { recursive: true });

    console.log(`Gathering ${k8sType} data...`);

    const labelSelector = (k8sType === 'PersistentVolumeClaims' || k8sType === 'PersistentVolumes')
      ? 'io.codefresh.accountName'
      : '';

    let resourceList;
    let resourceJSON;
    try {
      const getResources = await getK8sResources(k8sType, namespace, labelSelector);
      resourceList = getResources.resourceList;
      resourceJSON = getResources.resourceJSON;
    } catch (_error) {
      console.error(`Error getting ${k8sType} resources: error: the server doesn't have a resource type "${k8sType.toLocaleLowerCase()}"`);
      continue;
    }

    await Deno.writeTextFile(`${dirPath}/${k8sType}/_${k8sType}List.txt`, resourceList);

    if (k8sType === 'PersistentVolumeClaims' || k8sType === 'PersistentVolumes') {
      if (resourceJSON.items.length !== 0) {
        await writeGetApiCalls(resourceJSON.items, k8sType);
      }
      continue;
    }

    const sem = getSemaphore(k8sType, numOfProcesses);

    if (k8sType === 'Pods') {
      await Promise.all(
        resourceJSON.items.map(async (resource) => {
          const podName = resource.metadata.name;
          const containers = resource.spec.containers;

          await Promise.all(containers.map(async (container) => {
            await sem.acquire();
            try {
              const log = await getK8sLogs(namespace, podName, container.name);
              const logFileName = `${dirPath}/${k8sType}/${podName}_${container.name}.log`;
              await Deno.writeTextFile(logFileName, log);
            } finally {
              sem.release();
            }
          }));
        }),
      );
    }

    await Promise.all(resourceJSON.items.map(async (resource) => {
      await sem.acquire();
      try {
        const describeOutput = await describeK8sResources(k8sType, namespace, resource.metadata.name);
        const describeFileName = `${dirPath}/${k8sType}/${resource.metadata.name}.yaml`;
        await Deno.writeTextFile(describeFileName, describeOutput);
      } catch (error) {
        console.error(error);
      } finally {
        sem.release();
      }
    }));
  }

  await Deno.writeTextFile(`${dirPath}/Events.txt`, await getK8sEvents(namespace));
  await Deno.writeTextFile(`${dirPath}/cf-support-version.txt`, VERSION);
}

// ##############################
// MAIN
// ##############################
async function main() {
  try {
    console.log(`App Version: ${VERSION}\n`);
    const runtimeSelected = getUserRuntimeSelection();
    const cfConfig = await getCodefreshCredentials();

    switch (runtimeSelected) {
      case cfRuntimeTypes.pipelines:
        await gatherPipelinesRuntime(cfConfig);
        break;
      case cfRuntimeTypes.gitops:
        await gatherGitopsRuntime();
        break;
      case cfRuntimeTypes.onprem:
        await gatherOnPrem(cfConfig);
        break;
    }
  } catch (error) {
    console.error(`Error:`, error);
  }
}

await main();
