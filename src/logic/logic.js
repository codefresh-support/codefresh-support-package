import { stringify as toYaml } from '@std/yaml';
import { tgz } from '@deno-library/compress';
import { getPodLogs } from './k8s.js';

export function writeYaml(data, name, dirPath) {
    Deno.mkdirSync(dirPath, { recursive: true });
    const filePath = `${dirPath}/${name}.yaml`;
    Deno.writeTextFileSync(filePath, toYaml(data, { skipInvalid: true }));
}

export async function preparePackage(dirPath) {
    const supportPackageZip = `${dirPath}.tar.gz`;
    console.log('Preparing the Support Package');
    await tgz.compress(dirPath, supportPackageZip);
    console.log('Cleaning up temp directory');
    Deno.removeSync(dirPath, { recursive: true });
    console.log(`\nPlease attach ${supportPackageZip} to your support ticket.`);
}

export async function gatherData(dirPath, k8sResources) {
    for (const [k8sType, fetcher] of Object.entries(k8sResources)) {
        const resources = await fetcher();

        if (k8sType == 'pods') {
            for (const pod of resources.items) {
                delete pod.metadata.managedFields;

                writeYaml(pod, `${pod.metadata.name}_get`, `${dirPath}/${k8sType}/${pod.metadata.name}`);

                const logs = await getPodLogs(pod);
                for (const [containerName, logData] of Object.entries(logs)) {
                    Deno.writeTextFileSync(`${dirPath}/${k8sType}/${pod.metadata.name}/log_${containerName}`, logData)
                }
            }
            continue;
        }

        resources.items.map((data) => {
            writeYaml(data, `${data.metadata.name}_get`, `${dirPath}/${k8sType}`)
        })
    }
}
