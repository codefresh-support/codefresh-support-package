import { compress, toYaml } from '../deps.ts';

export class SupportPackageGenerator {
  private timestamp: number;
  private dirPath: string;

  constructor() {
    this.timestamp = new Date().getTime();
    this.dirPath = `./codefresh-support-${this.timestamp}`;
  }

  async saveItems(resources: any, dir: string) {
    try {
      await Deno.mkdir(`${this.dirPath}/${dir}/`, { recursive: true });
      const writePromises = resources.map(async (item: any) => {
        const filePath = `${this.dirPath}/${dir}/${item.metadata.name}_get.yaml`;
        const fileContent = toYaml(item, { skipInvalid: true });
        await Deno.writeTextFile(filePath, fileContent);
      });
      await Promise.all(writePromises);
    } catch (error) {
      console.error(`Error saving items to ${dir}:`, error);
    }
  }

  async prepareAndCleanup() {
    try {
      console.log(`\nSaving data to ./codefresh-support-package-${this.timestamp}.zip`);
      await compress(this.dirPath, `./codefresh-support-package-${this.timestamp}.zip`, { overwrite: true });

      console.log('\nCleaning up temp directory');
      await Deno.remove(this.dirPath, { recursive: true });

      console.log(`\nPlease attach ./codefresh-support-package-${this.timestamp}.zip to your support ticket.`);
    } catch (error) {
      console.error('Error during prepare and cleanup:', error);
    }
  }
}
