import { fetchAndSaveData, prepareAndCleanup, RuntimeType, writeCodefreshFiles } from '../deps.ts';

async function getRuntimes(config: { headers: { Authorization: string }; baseUrl: string }) {
  const response = await fetch(`${config.baseUrl}/runtime-environments`, {
    method: 'GET',
    headers: config.headers,
  });
  const runtimes = await response.json();
  return runtimes;
}

async function runTestPipeline(
  config: { headers: { Authorization: string }; baseUrl: string },
  runtimeName: string,
) {
  let selection = String(
    prompt(
      '\nTo troubleshoot, we would like to create a Demo Pipeline and run it.\nAfter creating this pipeline we will clean up the resources\n\nWould you like to proceed with the demo pipeline? (y/n): ',
    ),
  );
  while (selection !== 'y' && selection !== 'n') {
    console.log('Invalid selection. Please enter "y" or "n".');
    selection = String(prompt('\nWould you like to proceed with the demo pipeline? (y/n): '));
  }
  if (selection === 'n') {
    return;
  }

  console.log(`\nCreating a demo pipeline to test the ${runtimeName} runtime.`);

  const project = JSON.stringify({
    projectName: 'codefresh-support-package',
  });

  const pipeline = JSON.stringify({
    version: '1.0',
    kind: 'pipeline',
    metadata: {
      name: 'codefresh-support-package/TEST-PIPELINE-FOR-SUPPORT',
      project: 'codefresh-support-package',
      originalYamlString:
        'version: "1.0"\n\nsteps:\n\n  test:\n    title: Running test\n    type: freestyle\n    arguments:\n      image: alpine\n      commands:\n        - echo "Hello Test"',
    },
    spec: {
      concurrency: 1,
      runtimeEnvironment: {
        name: runtimeName,
      },
    },
  });

  const createProjectResponse = await fetch(`${config.baseUrl}/projects`, {
    method: 'POST',
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
    },
    body: project,
  });

  const projectStatus = await createProjectResponse.json();

  if (!createProjectResponse.ok) {
    console.error('Error creating project:', createProjectResponse.statusText);
    console.error(projectStatus);
    Deno.exit(20);
  }

  const createPipelineResponse = await fetch(`${config.baseUrl}/pipelines`, {
    method: 'POST',
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
    },
    body: pipeline,
  });

  const pipelineStatus = await createPipelineResponse.json();

  if (!createPipelineResponse.ok) {
    console.error('Error creating pipeline:', createPipelineResponse.statusText);
    console.error(pipelineStatus);
    Deno.exit(20);
  }

  const runPipelineResponse = await fetch(`${config.baseUrl}/pipelines/run/codefresh-support-package%2Fdemo-pipeline`, {
    method: 'POST',
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
    },
  });

  const runPipelineStatus = await runPipelineResponse.json();

  if (!runPipelineResponse.ok) {
    console.error('Error running pipeline:', runPipelineResponse.statusText);
    Deno.exit(20);
  }

  console.log(`Demo pipeline created and running build with id of ${runPipelineStatus}.`);

  return { pipelineID: pipelineStatus.metadata.id, projectID: projectStatus.id };
}

async function deleteTestPipeline(
  config: { headers: { Authorization: string }; baseUrl: string },
  pipelineID: string,
  projectID: string,
) {
  const deletePipelineResponse = await fetch(`${config.baseUrl}/pipelines/${pipelineID}`, {
    method: 'DELETE',
    headers: config.headers,
  });

  if (!deletePipelineResponse.ok) {
    console.error('Error deleting pipeline:', await deletePipelineResponse.text());
    Deno.exit(30);
  }

  const deleteProjectResponse = await fetch(`${config.baseUrl}/projects/${projectID}`, {
    method: 'DELETE',
    headers: config.headers,
  });

  if (!deleteProjectResponse.ok) {
    console.error('Error deleting project:', await deleteProjectResponse.text());
    Deno.exit(30);
  }

  console.log('Demo pipeline and project deleted successfully.');
}

export async function pipelinesRuntime(config: { headers: { Authorization: string }; baseUrl: string }) {
  try {
    const runtimes = await getRuntimes(config);
    console.log('');
    runtimes.forEach((re: any, index: number) => {
      console.log(`${index + 1}. ${re.metadata.name}`);
    });

    let selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
    while (isNaN(selection) || selection < 1 || selection > runtimes.length) {
      console.log('Invalid selection. Please enter a number corresponding to one of the listed runtimes.');
      selection = Number(prompt('\nWhich Pipelines Runtime Are We Working With? (Number): '));
    }

    const reSpec = runtimes[selection - 1];
    const namespace = reSpec.runtimeScheduler.cluster.namespace;

    const pipelineExecutionOutput = await runTestPipeline(config, reSpec.metadata.name);

    console.log(`\nGathering Data For ${reSpec.metadata.name} in the "${namespace}" namespace.`);

    // Wait 15 seconds to allow the pipeline to run
    await new Promise((resolve) => setTimeout(resolve, 15000));

    await fetchAndSaveData(RuntimeType.pipelines, namespace);
    await writeCodefreshFiles(reSpec, 'pipelines-runtime-spec');
    console.log('Data Gathered Successfully.');

    if (pipelineExecutionOutput) {
      await deleteTestPipeline(config, pipelineExecutionOutput?.pipelineID, pipelineExecutionOutput?.projectID);
    }

    await prepareAndCleanup();
  } catch (error) {
    console.error(`Error gathering Pipelines Runtime data:`, error);
  }
}
