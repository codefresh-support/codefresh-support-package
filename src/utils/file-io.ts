import {
  compress,
  describeK8sResources,
  getFormattedEvents,
  getHelmReleases,
  getK8sLogs,
  getK8sResources,
  getPodList,
  getPVCList,
  getPVList,
  RuntimeType,
  toYaml,
} from '../deps.ts';

const timestamp = new Date().getTime();
const dirPath = `./codefresh-support-${timestamp}`;

async function creatDirectory(path: string) {
  await Deno.mkdir(`${dirPath}/${path}/`, { recursive: true });
}

export async function writeCodefreshFiles(data: any, name: string) {
  const filePath = `${dirPath}/${name}.yaml`;
  const fileContent = toYaml(data, { skipInvalid: true });
  await Deno.writeTextFile(filePath, fileContent);
}

async function writeGetApiCalls(resources: any, path: string) {
  const writePromises = resources.map(async (item: any) => {
    const filePath = `${dirPath}/${path}/${item.metadata.name}_get.yaml`;
    const fileContent = toYaml(item, { skipInvalid: true });
    await Deno.writeTextFile(filePath, fileContent);
  });
  await Promise.all(writePromises);
}

export async function prepareAndCleanup() {
  console.log(`\nSaving data to ./codefresh-support-package-${timestamp}.zip`);
  await compress(dirPath, `./codefresh-support-package-${timestamp}.zip`, { overwrite: true });

  console.log('\nCleaning up temp directory');
  await Deno.remove(dirPath, { recursive: true });

  console.log(`\nPlease attach ./codefresh-support-package-${timestamp}.zip to your support ticket.`);
}

export async function fetchAndSaveData(type: RuntimeType, namespace: string) {
  await Deno.mkdir(`${dirPath}/`, { recursive: true });

  const runtimeResources = await getK8sResources(type, namespace);

  if (!runtimeResources) {
    console.error('Unable to get resources');
    return;
  }

  for (const [itemType, resources] of Object.entries(runtimeResources)) {
    if (itemType === 'Events') {
      const formattedEvents = getFormattedEvents(resources);
      await Deno.writeTextFile(`${dirPath}/Events.txt`, formattedEvents);
    }

    if (itemType === 'HelmReleases') {
      const helmReleases = getHelmReleases(resources);
      await Deno.writeTextFile(`${dirPath}/HelmReleases.txt`, JSON.stringify(helmReleases, null, 2));
    }

    await creatDirectory(itemType);

    if (itemType === 'Pods') {
      const podList = getPodList(resources);
      await Deno.writeTextFile(`${dirPath}/PodList.txt`, podList);

      await Promise.all(resources.items.map(async (resource: { metadata: { name: string }; spec: { containers: any } }) => {
        const podName = resource.metadata.name;
        const containers = resource.spec.containers;

        await Promise.all(containers.map(async (container: { name: string }) => {
          const log = await getK8sLogs(namespace, podName, container.name);
          const logFileName = `${dirPath}/${itemType}/${podName}_${container.name}_log.log`;
          await Deno.writeTextFile(logFileName, log);
        }));
      }));
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

    await Promise.all(resources.items.map(async (resource: { metadata: { name: string } }) => {
      const describeOutput = await describeK8sResources(itemType, namespace, resource.metadata.name);
      const describeFileName = `${dirPath}/${itemType}/${resource.metadata.name}_describe.yaml`;
      await Deno.writeTextFile(describeFileName, describeOutput);
    }));
  }
}
