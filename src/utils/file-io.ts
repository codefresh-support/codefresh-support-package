import { compress, toYaml, getK8sResources, getFormattedEvents, getHelmReleases, describeK8sResources, RuntimeType, getK8sLogs, getPodList, getPVCList, getPVList } from '../deps.ts';

const timestamp = new Date().getTime();
const dirPath = `./codefresh-support-${timestamp}`;

async function creatDirectory(path: string) {
  try {
    await Deno.mkdir(`${dirPath}/${path}/`, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${path}:`, error);
  }
}

// export async function writeGetApiCalls(resources: any, path: string) {
//   try {
//     const writePromises = resources.map(async (item: any) => {
//       const filePath = `${dirPath}/${path}/${item.metadata.name}_get.yaml`;
//       const fileContent = toYaml(item, { skipInvalid: true });
//       await Deno.writeTextFile(filePath, fileContent);
//     });
//     await Promise.all(writePromises);
//   } catch (error) {
//     console.error(`Error saving items to ${path}:`, error);
//   }
// }

export async function prepareAndCleanup() {
  try {
    console.log(`\nSaving data to ./codefresh-support-package-${timestamp}.zip`);
    await compress(dirPath, `./codefresh-support-package-${timestamp}.zip`, { overwrite: true });

    console.log('\nCleaning up temp directory');
    await Deno.remove(dirPath, { recursive: true });

    console.log(`\nPlease attach ./codefresh-support-package-${timestamp}.zip to your support ticket.`);
  } catch (error) {
    console.error('Error during prepare and cleanup:', error);
  }
}

export async function fetchAndSaveData(type: RuntimeType, namespace: string) {
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

      await Promise.all(resources.items.map(async (resource: { metadata: { name: string; }; spec: { containers: any; }; }) => {
        const podName = resource.metadata.name;
        const containers = resource.spec.containers;

        await Promise.all(containers.map(async (container: { name: string; }) => {
          const log = await getK8sLogs(namespace, podName, container.name);
          const logFileName = `${dirPath}/${itemType}/${podName}_${container.name}_log.log`;
          await Deno.writeTextFile(logFileName, log);
        }));
      }));
    }

    if (itemType === 'Volumeclaims') {
      const pvcList = getPVCList(resources);
      await Deno.writeTextFile(`${dirPath}/VolumeClaimsList.txt`, pvcList);
    }

    if (itemType === 'Volumes') {
      const pvList = getPVList(resources);
      await Deno.writeTextFile(`${dirPath}/VolumesList.txt`, pvList);
    }

    await Promise.all(resources.items.map(async (resource: { metadata: { name: string; }; }) => {
      const describeOutput = await describeK8sResources(itemType, namespace, resource.metadata.name);
      const describeFileName = `${dirPath}/${itemType}/${resource.metadata.name}_describe.txt`;
      await Deno.writeTextFile(describeFileName, describeOutput);
    }));

  }

}
