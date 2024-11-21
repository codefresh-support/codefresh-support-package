'use strict';
import { autoDetectClient } from '@cloudydeno/kubernetes-client';
import { AppsV1Api } from '@cloudydeno/kubernetes-apis/apps/v1';
import { BatchV1Api } from '@cloudydeno/kubernetes-apis/batch/v1';
import { CoreV1Api } from '@cloudydeno/kubernetes-apis/core/v1';
import { StorageV1Api } from '@cloudydeno/kubernetes-apis/storage.k8s.io/v1';
import { ArgoprojIoV1alpha1Api } from '@cloudydeno/kubernetes-apis/argoproj.io/v1alpha1';
import { compress } from '@fakoua/zip-ts';
import { parse, stringify as toYaml } from '@std/yaml';
import { Table } from '@cliffy/table';
import { getSemaphore } from '@henrygd/semaphore';

const VERSION = "__APP_VERSION__";

const RuntimeTypes = {
  pipelines: 'Pipelines Runtime',
  gitops: 'GitOps Runtime',
  onprem: 'On-Prem',
};

const timestamp = new Date().getTime();
const dirPath = `./codefresh-support-${timestamp}`;
const numOfProcesses = 5;

const kubeConfig = await autoDetectClient();
const appsApi = new AppsV1Api(kubeConfig);
const coreApi = new CoreV1Api(kubeConfig);
const storageApi = new StorageV1Api(kubeConfig);
const batchApi = new BatchV1Api(kubeConfig);
const argoProj = new ArgoprojIoV1alpha1Api(kubeConfig);

// ##############################
// KUBERNETES
// ##############################
async function selectNamespace() {
    const namespaceList = await coreApi.getNamespaceList();
    if (!namespaceList.items || namespaceList.items.length === 0) {
      throw new Error('No namespaces found.');
    }

    console.log('');
    namespaceList.items.forEach((namespace, index) => {
      console.log(`${index + 1}. ${namespace.metadata?.name}`);
    });

    let selection;
    do {
      selection = Number(prompt('\nWhich Namespace Is Codefresh Installed In? (Number): '));
      if (isNaN(selection) || selection < 1 || selection > namespaceList.items.length) {
        console.log('Invalid selection. Please enter a number corresponding to one of the listed namespaces.');
      }
    } while (isNaN(selection) || selection < 1 || selection > namespaceList.items.length);

    return namespaceList.items[selection - 1].metadata.name;
}

function getK8sResources(runtimeType, namespace) {
  switch (runtimeType) {
    case RuntimeTypes.pipelines || RuntimeTypes.onprem:
      return {
        'CronJobs': () => batchApi.namespace(namespace).getCronJobList(),
        'Jobs': () => batchApi.namespace(namespace).getJobList(),
        'Deployments': () => appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': () => appsApi.namespace(namespace).getDaemonSetList(),
        'Nodes': () => coreApi.getNodeList(),
        'Volumes': () => coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
        'Volumeclaims': () => coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList(),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Storageclass': () => storageApi.getStorageClassList(),
        'Events': () => coreApi.namespace(namespace).getEventList(),
      };
    case RuntimeTypes.gitops:
      return {
        'Apps': () => argoProj.namespace(namespace).getApplicationList(),
        'AppSets': () => argoProj.namespace(namespace).getApplicationSetList(),
        'CronJobs': () => batchApi.namespace(namespace).getCronJobList(),
        'Jobs': () => batchApi.namespace(namespace).getJobList(),
        'Deployments': () => appsApi.namespace(namespace).getDeploymentList(),
        'Daemonsets': () => appsApi.namespace(namespace).getDaemonSetList(),
        'Statefulsets': () => appsApi.namespace(namespace).getStatefulSetList(),
        'Nodes': () => coreApi.getNodeList(),
        'Configmaps': () => coreApi.namespace(namespace).getConfigMapList(),
        'Services': () => coreApi.namespace(namespace).getServiceList(),
        'Pods': () => coreApi.namespace(namespace).getPodList(),
        'Events': () => coreApi.namespace(namespace).getEventList(),
      };
    default:
      throw new Error('Invalid runtime type selected');
  }
}

function calculateAge(creationTimestamp) {
  const now = new Date();
  const diffMs = now - new Date(creationTimestamp);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffDays}d ${diffHours}h ${diffMinutes}m`;
}

function getFormattedEvents(events) {
  const sortedEvents = events.items.sort((a, b) => 
    new Date(a.metadata?.creationTimestamp ?? 0) - new Date(b.metadata?.creationTimestamp ?? 0)
  );

  const formattedEvents = sortedEvents.length > 0
    ? sortedEvents.map(event => ({
        lastSeen: event.lastTimestamp ? calculateAge(event.lastTimestamp) : 'N/A',
        type: event.type ?? 'N/A',
        reason: event.reason ?? 'N/A',
        kind: event.involvedObject?.kind ?? 'N/A',
        name: event.involvedObject?.name ?? 'N/A',
        message: event.message ?? 'N/A'
      }))
    : [{ lastSeen: 'N/A', type: 'N/A', reason: 'N/A', kind: 'N/A', name: 'N/A', message: 'N/A' }];

  const table = new Table();
  table.fromJson(formattedEvents);
  return table.toString();
}

// TODO: convert using the kubernetes sdk
async function describeK8sResources(resourceType, namespace, name) {
  const describe = new Deno.Command('kubectl', {
    args: ['describe', resourceType.toLowerCase(), '-n', namespace, name],
  });
  return new TextDecoder().decode((await describe.output()).stdout);
}

async function getK8sLogs(namespace, podName, containerName) {
  try {
    const logs = await coreApi.namespace(namespace).getPodLog(podName, {
      container: containerName,
      timestamps: true,
    });
    return logs;
  } catch (error) {
    return error.message;
  }
}

function getPodList(pods) {
  const podList = pods.items.length > 0
    ? pods.items.map((pod) => {
      const name = pod.metadata?.name ?? 'N/A';
      const ready = `${pod.status?.containerStatuses?.filter((cs) => cs.ready).length ?? 0}/${
        pod.status?.containerStatuses?.length ?? 0
      }`;
      const status = pod.status?.phase ?? 'Unknown';
      const restarts = pod.status?.containerStatuses?.reduce((acc, cur) => acc + (cur.restartCount ?? 0), 0) ?? 0;
      const age = pod.metadata?.creationTimestamp ? calculateAge(pod.metadata.creationTimestamp) : 'N/A';
      return { name, ready, status, restarts, age };
    })
    : [{ name: 'N/A', ready: 'N/A', status: 'N/A', restarts: 'N/A', age: 'N/A' }];
  const table = new Table();
  table.fromJson(podList);
  return table.toString();
}

function getPVCList(volumeClaims) {
  const formattedPVC = volumeClaims.items.length > 0
    ? volumeClaims.items.map(({ metadata, status, spec }) => {
        const name = metadata?.name ?? 'N/A';
        const phase = status?.phase ?? 'Unknown';
        const volume = spec?.volumeName ?? 'N/A';
        const capacity = `${spec?.resources?.requests?.storage?.number ?? 'N/A'} ${spec?.resources?.requests?.storage?.suffix ?? 'N/A'}`;
        const accessModes = spec?.accessModes?.join(', ') ?? 'N/A';
        const storageClass = spec?.storageClassName ?? 'N/A';
        const age = metadata?.creationTimestamp ? calculateAge(metadata.creationTimestamp) : 'N/A';
        return { name, status: phase, volume, capacity, accessModes, storageClass, age };
      })
    : [{
        name: 'N/A',
        status: 'N/A',
        volume: 'N/A',
        capacity: 'N/A',
        accessModes: 'N/A',
        storageClass: 'N/A',
        age: 'N/A',
      }];

  const table = new Table();
  table.fromJson(formattedPVC);
  return table.toString();
}

function getPVList(volumes) {
  const formattedPV = volumes.items.length > 0
    ? volumes.items.map(({ metadata, spec, status }) => {
        const name = metadata?.name ?? 'N/A';
        const capacity = `${spec?.capacity?.storage?.number ?? 'N/A'} ${spec?.capacity?.storage?.suffix ?? 'N/A'}`;
        const accessModes = spec?.accessModes?.join(', ') ?? 'N/A';
        const reclaimPolicy = spec?.persistentVolumeReclaimPolicy ?? 'N/A';
        const phase = status?.phase ?? 'Unknown';
        const claim = `${spec?.claimRef?.namespace ?? 'N/A'}/${spec?.claimRef?.name ?? 'N/A'}`;
        const storageClass = spec?.storageClassName ?? 'N/A';
        const age = metadata?.creationTimestamp ? calculateAge(metadata.creationTimestamp) : 'N/A';
        return { name, capacity, accessModes, reclaimPolicy, status: phase, claim, storageClass, age };
      })
    : [{
        name: 'N/A',
        capacity: 'N/A',
        accessModes: 'N/A',
        reclaimPolicy: 'N/A',
        status: 'N/A',
        claim: 'N/A',
        storageClass: 'N/A',
        age: 'N/A',
      }];

  const table = new Table();
  table.fromJson(formattedPV);
  return table.toString();
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
  const runtimes = Object.values(RuntimeTypes);

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

  const projectName = 'codefresh-support-package';
  const pipelineName = 'TEST-PIPELINE-FOR-SUPPORT';

  const project = JSON.stringify({
    projectName: projectName,
  });

  const pipeline = JSON.stringify({
    version: '1.0',
    kind: 'pipeline',
    metadata: {
      name: `${projectName}/${pipelineName}`,
      project: projectName,
      originalYamlString:
        'version: "1.0"\n\nsteps:\n\n  test:\n    title: Running test\n    type: freestyle\n    arguments:\n      image: alpine\n      commands:\n        - echo "Hello Test"',
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
    console.error('Error creating pipeline:', createPipelineResponse.statusText);
    console.error(pipelineStatus);
    const getPipelineID = await fetch(`${cfConfig.baseUrl}/pipelines/${projectName}%2f${pipelineName}`, {
      method: 'GET',
      headers: cfConfig.headers,
    });
    const pipelineResponse = await getPipelineID.json();
    pipelineStatus.metadata = {};
    pipelineStatus.metadata.id = pipelineResponse.metadata.id;
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
    console.error('Error running pipeline:', runPipelineResponse.statusText);
    console.error(runPipelineStatus);
    return { pipelineID: pipelineStatus.metadata.id, projectID: projectStatus.id };
  }

  console.log(`Demo pipeline created and running build with id of ${runPipelineStatus}.`);

  return { pipelineID: pipelineStatus.metadata.id, projectID: projectStatus.id };
}

async function deleteTestPipeline(cfConfig, pipelineID, projectID) {
  const deletePipelineResponse = await fetch(`${cfConfig.baseUrl}/pipelines/${pipelineID}`, {
    method: 'DELETE',
    headers: cfConfig.headers,
  });

  if (!deletePipelineResponse.ok) {
    console.error('Error deleting pipeline:', await deletePipelineResponse.text());
    Deno.exit(1);
  }

  const deleteProjectResponse = await fetch(`${cfConfig.baseUrl}/projects/${projectID}`, {
    method: 'DELETE',
    headers: cfConfig.headers,
  });

  if (!deleteProjectResponse.ok) {
    console.error('Error deleting project:', await deleteProjectResponse.text());
    Deno.exit(1);
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
      namespace = await selectNamespace();
    }

    console.log(`\nGathering Data For ${reSpec?.metadata.name ?? 'Pipelines Runtime'} in the "${namespace}" namespace.`);

    // Wait 15 seconds to allow the pipeline to run
    await new Promise((resolve) => setTimeout(resolve, 15000));

    await fetchAndSaveData(RuntimeTypes.pipelines, namespace);

    if (reSpec) {
      await writeCodefreshFiles(reSpec, 'pipelines-runtime-spec');
    }

    console.log('Data Gathered Successfully.');

    if (pipelineExecutionOutput) {
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
    const namespace = await selectNamespace();
    console.log(`\nGathering data in "${namespace}" namespace for the GitOps Runtime.`);
    await fetchAndSaveData(RuntimeTypes.gitops, namespace);
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
      `\nCannot gather On-Prem data for Codefresh SaaS. Please select either ${RuntimeTypes.pipelines} or ${RuntimeTypes.gitops}.\n If you need to gather data for Codefresh On-Prem, please update your ./cfconfig context (or Envs) to point to an On-Prem instance.`,
    );
    throw new Error('Invalid Codefresh On-Prem URL.');
  }

  try {
    const namespace = await selectNamespace();
    console.log(`\nGathering data in "${namespace}" namespace for Codefresh On-Prem.`);

    await fetchAndSaveData(RuntimeTypes.onprem, namespace);

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
async function creatDirectory(path) {
  await Deno.mkdir(`${dirPath}/${path}/`, { recursive: true });
}

async function writeCodefreshFiles(data, name) {
  const filePath = `${dirPath}/${name}.yaml`;
  const fileContent = toYaml(data, { skipInvalid: true });
  await Deno.writeTextFile(filePath, fileContent);
}

async function writeGetApiCalls(resources, path) {
  const sem = getSemaphore(path, numOfProcesses);
  await Promise.all(resources.map(async (item) => {
    await sem.acquire();
    try {
      const filePath = `${dirPath}/${path}/${item.metadata.name}_get.yaml`;
      const fileContent = toYaml(item, { skipInvalid: true });
      await Deno.writeTextFile(filePath, fileContent);
    } finally {
      sem.release();
    }
  }));
}

async function prepareAndCleanup() {
  console.log(`Saving data to ./codefresh-support-package-${timestamp}.zip`);
  await compress(dirPath, `./codefresh-support-package-${timestamp}.zip`, { overwrite: true });

  console.log('Cleaning up temp directory');
  await Deno.remove(dirPath, { recursive: true });

  console.log(`\nPlease attach ./codefresh-support-package-${timestamp}.zip to your support ticket.`);
}

async function fetchAndSaveData(type, namespace) {
  await Deno.mkdir(`${dirPath}/`, { recursive: true });

  await Deno.writeTextFile(`${dirPath}/cf-support-version.txt`, VERSION);

  for (const [itemType, fetcher] of Object.entries(getK8sResources(type, namespace) || {})) {
    const resources = await fetcher();

    if (itemType === 'Events') {
      const formattedEvents = getFormattedEvents(resources);
      await Deno.writeTextFile(`${dirPath}/Events.txt`, formattedEvents);
      continue;
    }

    await creatDirectory(itemType);

    if (itemType === 'Pods') {
      const podList = getPodList(resources);
      await Deno.writeTextFile(`${dirPath}/PodList.txt`, podList);

      await Promise.all(
        resources.items.map(async (resource) => {
          const podName = resource.metadata.name;
          const containers = resource.spec.containers;

          await Promise.all(containers.map(async (container) => {
            const log = await getK8sLogs(namespace, podName, container.name);
            const logFileName = `${dirPath}/${itemType}/${podName}_${container.name}_log.log`;
            await Deno.writeTextFile(logFileName, log);
          }));
        }),
      );
    }

    if (itemType === 'Volumeclaims') {
      const pvcList = getPVCList(resources);
      await Deno.writeTextFile(`${dirPath}/VolumeClaimsList.txt`, pvcList);
      await writeGetApiCalls(resources.items, itemType);
      continue;
    }

    if (itemType === 'Volumes') {
      const pvList = getPVList(resources);
      await Deno.writeTextFile(`${dirPath}/VolumesList.txt`, pvList);
      await writeGetApiCalls(resources.items, itemType);
      continue;
    }

    const sem = getSemaphore(itemType, numOfProcesses);
    await Promise.all(resources.items.map(async (resource) => {
      await sem.acquire();
      try {
        const describeOutput = await describeK8sResources(itemType, namespace, resource.metadata.name);
        const describeFileName = `${dirPath}/${itemType}/${resource.metadata.name}_describe.yaml`;
        await Deno.writeTextFile(describeFileName, describeOutput);
      } finally {
        sem.release();
      }
    }));
  }
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
      case RuntimeTypes.pipelines:
        await gatherPipelinesRuntime(cfConfig);
        break;
      case RuntimeTypes.gitops:
        await gatherGitopsRuntime();
        break;
      case RuntimeTypes.onprem:
        await gatherOnPrem(cfConfig);
        break;
    }
  } catch (error) {
    console.error(`Error:`, error);
  }
}

await main();
