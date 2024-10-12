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