import { stringify as toYaml } from '@std/yaml';
import { tgz } from '@deno-library/compress';

export function writeYaml(data, name, dirPath) {
    Deno.mkdirSync(dirPath, { recursive: true })
    const filePath = `${dirPath}/${name}.yaml`
    Deno.writeTextFileSync(filePath, toYaml(data, { skipInvalid: true }))
}

export async function preparePackage(dirPath) {
    const supportPackageZip = `${dirPath}.tar.gz`
    console.log("Preparing the Support Package")
    await tgz.compress(dirPath, supportPackageZip);
    console.log('Cleaning up temp directory');
    Deno.removeSync(dirPath, { recursive: true });
    console.log(`\nPlease attach ${supportPackageZip} to your support ticket.`);
}

