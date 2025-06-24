import { stringify as toYaml } from '@std/yaml';
import { tgz } from '@deno-library/compress';
import { getPodLogs } from './k8s.js';
import { getSemaphore } from '@henrygd/semaphore';

const semaphore = getSemaphore('supportPackageSemaphore', 10);

export async function writeYaml(data, name, dirPath) {
    await semaphore.acquire();
    try {
        await Deno.mkdir(dirPath, { recursive: true });
        const filePath = `${dirPath}/${name}.yaml`;
        await Deno.writeTextFile(filePath, toYaml(data, { skipInvalid: true }));
    } finally {
        semaphore.release();
    }
}

export async function preparePackage(dirPath) {
    await semaphore.acquire();
    try {
        const supportPackageZip = `${dirPath}.tar.gz`;
        console.log('Preparing the Support Package');
        await tgz.compress(dirPath, supportPackageZip);
        console.log('Cleaning up temp directory');
        await Deno.remove(dirPath, { recursive: true });
        console.log(`\nPlease attach ${supportPackageZip} to your support ticket.`);
    } finally {
        semaphore.release();
    }
}

export async function processData(dirPath, k8sResources) {
    console.log('Processing and Saving Data');

    for (const [k8sType, fetcher] of Object.entries(k8sResources)) {
        const resources = await fetcher();

        if (!resources) {
            continue;
        }

        if (k8sType == 'pods') {
            for (const pod of resources.items) {
                await semaphore.acquire();
                try {
                    delete pod.metadata.managedFields;

                    await writeYaml(pod, `spec_${pod.metadata.name}`, `${dirPath}/${k8sType}/${pod.metadata.name}`);

                    const logs = await getPodLogs(pod);
                    for (const [containerName, logData] of Object.entries(logs)) {
                        await Deno.writeTextFile(
                            `${dirPath}/${k8sType}/${pod.metadata.name}/log_${containerName}.log`,
                            logData,
                        );
                    }
                } finally {
                    semaphore.release();
                }
            }
            continue;
        }

        if (k8sType == 'events.k8s.io') {
            const formattedEvents = resources.items.map((event) => {
                const lastSeen = event.metadata.creationTimestamp
                    ? new Date(event.metadata.creationTimestamp).toISOString()
                    : 'Invalid Date';
                const type = event.type || 'Unknown';
                const reason = event.reason || 'Unknown';
                const object = `${event.involvedObject.kind}/${event.involvedObject.name}`;
                const message = event.message || 'No message';

                return `${lastSeen}\t${type}\t${reason}\t${object}\t${message}`;
            });

            const header = 'LAST SEEN\tTYPE\tREASON\tOBJECT\tMESSAGE\n';
            const content = header + formattedEvents.join('\n');

            await Deno.writeTextFile(`${dirPath}/${k8sType}.csv`, content);

            continue;
        }

        await Promise.all(resources.items.map(async (data) => {
            await semaphore.acquire();
            try {
                delete data.metadata.managedFields;
                await writeYaml(data, `${data.metadata.name}_get`, `${dirPath}/${k8sType}`);
            } finally {
                semaphore.release();
            }
        }));
    }
}
