// TODO: Find a way to get Helm Releases without the use for the Helm CLI
async function getHelmReleases(namespace: string) {
  try {
    const helmList = new Deno.Command('helm', { args: ['list', '-n', namespace, '-o', 'json'] });
    const output = await helmList.output();
    const helmReleases = JSON.parse(new TextDecoder().decode(output.stdout));
    return helmReleases;
  } catch (error) {
    console.error(error);
  }
}

export { getHelmReleases };


// import * as k8s from '@kubernetes/client-node';

// async function getHelmReleases(namespace: string) {
//   try {
//     const kc = new k8s.KubeConfig();
//     kc.loadFromDefault();
//     const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

//     const secrets = await k8sApi.listNamespacedSecret(namespace);
//     const helmReleases = secrets.body.items
//       .filter(secret => secret.metadata?.labels?.owner === 'helm')
//       .map(secret => {
//         const releaseData = secret.data?.['release'];
//         if (releaseData) {
//           const decodedData = Buffer.from(releaseData, 'base64').toString('utf-8');
//           return JSON.parse(decodedData);
//         }
//         return null;
//       })
//       .filter(release => release !== null);

//     return helmReleases;
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// }

// export { getHelmReleases };