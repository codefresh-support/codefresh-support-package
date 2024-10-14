import { compress, toYaml } from '../deps.ts';

const timestamp = new Date().getTime();
const dirPath = `./codefresh-support-${timestamp}`

export async function saveGetEvents(resources: any, dir: string) {
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

export async function saveLogFile() {

}

export async function saveTextFile() {
  
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
