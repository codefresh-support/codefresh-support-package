import { toYaml, compress } from '../deps.ts';

const timestamp = new Date().getTime();
const dirPath = `./codefresh-support-${timestamp}`;

async function saveItems(resources: any, dir: string) {
  try {
    await Deno.mkdir(`${dirPath}/${dir}/`, { recursive: true });
    const writePromises = resources.map(async (item: any) => {
      const filePath = `${dirPath}/${dir}/${item.metadata.name}_get.yaml`;
      const fileContent = toYaml(item, { skipInvalid: true });
      await Deno.writeTextFile(filePath, fileContent);
    });
    await Promise.all(writePromises);
  } catch (error) {
    console.error(`Error saving items to ${dir}:`, error);
  }
}

async function preparePackage() {
  console.log(`\nSaving data to ./codefresh-support-package-${timestamp}.zip`);
  await compress(dirPath, `./codefresh-support-package-${timestamp}.zip`, { overwrite: true });
}

async function cleanup() {
  console.log('\nCleaning up temp directory');
  await Deno.remove(dirPath, { recursive: true });
}

async function prepareAndCleanup() {
  await preparePackage();
  await cleanup();
  console.log(`\nPlease attach ./codefresh-support-package-${timestamp}.zip to your support ticket.`);
  console.log('Before attaching, verify the contents and remove any sensitive information.');
}

export { saveItems, prepareAndCleanup };