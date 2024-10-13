export function getUserRuntimeSelection(runtimes: string[]): number {
  runtimes.forEach((runtimeName, index) => {
    console.log(`${index + 1}. ${runtimeName}`);
  });

  let selection = Number(prompt('\nWhich Type Of Runtime Are We Using? (Number):'));
  while (isNaN(selection) || selection < 1 || selection > runtimes.length) {
    console.log('Invalid selection. Please enter a number corresponding to one of the listed options.');
    selection = Number(prompt('\nWhich Type Of Runtime Are We Using? (Number):'));
  }

  return selection;
}
