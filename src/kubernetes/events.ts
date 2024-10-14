// convert to to using the kubernetes sdk

export async function saveEvents(namespace: string) {
  try {
    const events = new Deno.Command('kubectl', { args: ['get', 'events', '-n', namespace, '--sort-by=.metadata.creationTimestamp'] });
    const output = await events.output();
    await Deno.writeTextFile(`${dirPath}/Events.txt`, new TextDecoder().decode(output.stdout));
  } catch (error) {
    console.error(`Error saving events:`, error);
  }
}