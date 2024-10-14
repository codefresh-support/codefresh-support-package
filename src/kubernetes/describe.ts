// convert using the kubernetes sdk

export async function describeItems(dir, namespace, name) {
  try {
    const describe = new Deno.Command('kubectl', { args: ['describe', dir.toLowerCase(), '-n', namespace, name] });
    const output = await describe.output();
    await Deno.writeTextFile(`${dirPath}/${dir}/${name}_describe.yaml`, new TextDecoder().decode(output.stdout));
  } catch (error) {
    console.error(`Failed to describe ${name}:`, error);
  }
}