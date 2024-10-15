import { compress, toYaml } from '../deps.ts';

const timestamp = new Date().getTime();
const dirPath = `./codefresh-support-${timestamp}`;

export async function creatDirectory(path: string) {
  try {
    await Deno.mkdir(`${dirPath}/${path}/`, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${path}:`, error);
  }
}

export async function writeGetApiCalls(resources: any, path: string) {
  try {
    const writePromises = resources.map(async (item: any) => {
      const filePath = `${dirPath}/${path}/${item.metadata.name}_get.yaml`;
      const fileContent = toYaml(item, { skipInvalid: true });
      await Deno.writeTextFile(filePath, fileContent);
    });
    await Promise.all(writePromises);
  } catch (error) {
    console.error(`Error saving items to ${path}:`, error);
  }
}

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

// async function fetchAndSaveData(type, namespace) {
//   for (const [dir, fetcher] of Object.entries(dataFetchers(type, namespace))) {
//     const resources = await fetcher();

//     await saveItems(resources.items, dir);

//     if (dir === 'Pods') {
//       await Promise.all(resources.items.map(async (item) => {
//         const podName = item.metadata.name;
//         const containers = item.spec.containers;

//         await Promise.all(containers.map(async (container) => {
//           let log;
//           try {
//             log = await coreApi.namespace(namespace).getPodLog(podName, {
//               container: container.name,
//               timestamps: true,
//             });
//           } catch (error) {
//             console.error(`Failed to get logs for container ${container.name} in pod ${podName}:`, error);
//             log = error.toString();
//           }
//           const logFileName = `${dirPath}/${dir}/${podName}_${container.name}_log.log`;
//           await Deno.writeTextFile(logFileName, log);
//         }));

//         await describeItems(dir, namespace, podName);
//       }));
//     }

//     if (dir === 'Nodes') {
//       await Promise.all(resources.items.map(async (item) => {
//         await describeItems(dir, namespace, item.metadata.name);
//       }));
//     }
//   }
//   await saveHelmReleases(type, namespace);
//   await saveEvents(namespace);
//   const listPods = new Deno.Command('kubectl', { args: ['get', 'pods', '-n', namespace] });
//   const output = await listPods.output();
//   await Deno.writeTextFile(`${dirPath}/ListPods.txt`, new TextDecoder().decode(output.stdout));
// }
