async function gitops() {
  try {
    const namespaceList = await coreApi.getNamespaceList();
    console.log('');
    namespaceList.items.forEach((ns, index) => {
      console.log(`${index + 1}. ${ns.metadata.name}`);
    });

    let selection = Number(prompt('\nWhich Namespace Is The GitOps Runtime Installed In? (Number): '));
    while (isNaN(selection) || selection < 1 || selection > namespaceList.items.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed namespaces.');
      selection = Number(prompt('\nWhich Namespace Is The GitOps Runtime Installed In? (Number): '));
    }

    const namespace = namespaceList.items[selection - 1].metadata.name;

    console.log(`\nGathering Data In ${namespace} For The GitOps Runtime.`);

    await fetchAndSaveData('GitOps Runtime', namespace);
  } catch (error) {
    console.error(`Error gathering GitOps runtime data:`, error);
  }
}

export { gitops };