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

export async function processData(dirPath, k8sResources) {
    console.log('Processing and Saving Data');

    for (const [k8sType, fetcher] of Object.entries(k8sResources)) {
        const resources = await fetcher();

        if (!resources) {
            continue
        }

        if (k8sType == 'pods') {
            for (const pod of resources.items) {
                delete pod.metadata.managedFields;

                writeYaml(pod, `spec_${pod.metadata.name}`, `${dirPath}/${k8sType}/${pod.metadata.name}`);

                const logs = await getPodLogs(pod);
                for (const [containerName, logData] of Object.entries(logs)) {
                    Deno.writeTextFileSync(
                        `${dirPath}/${k8sType}/${pod.metadata.name}/log_${containerName}.log`,
                        logData,
                    );
                }
            }
            continue;
        }

        if (k8sType == 'events.k8s.io') {
            const formattedEvents = resources.items.map((event) => {
                const lastSeen = event.metadata.creationTimestamp || 'Invalid Date';
                const type = event.type || 'Unknown';
                const reason = event.reason || 'Unknown';
                const object = `${event.involvedObject.kind}/${event.involvedObject.name}`;
                const message = event.message || 'No message';

                return `${lastSeen}\t${type}\t${reason}\t${object}\t${message}`;
            });

            const header = 'LAST SEEN\tTYPE\tREASON\tOBJECT\tMESSAGE\n';
            const content = header + formattedEvents.join('\n');

            Deno.writeTextFileSync(`${dirPath}/${k8sType}.csv`, content);

            continue;
        }

        
        resources.items.map((data) => {
            delete data.metadata.managedFields;
            writeYaml(data, `${data.metadata.name}_get`, `${dirPath}/${k8sType}`);
        });
    }
}
