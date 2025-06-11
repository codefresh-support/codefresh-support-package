import { Command } from "@cliffy/command";

export const gitopsCommand = new Command()
  .description("Collect data for the Codefresh GitOps Runtime")
  .option("-n, --namespace <namespace:string>", "The namespace where the GitOps Runtime is installed", { required: false })
  .action((options) => {
    deployGitOps(options.env);
  });

export const pipelinesCommand = new Command()
  .description("Collect data for the Codefresh Pipelines Runtime")
  .option("-n, --namespace <namespace:string>", "The namespace where the Pipelines Runtime is installed", { required: false })
  .option("-re, --runtime <runtime:string>", "The name of the Pipelines Runtime", { required: false })
  .action((options) => {
    runPipeline(options.project);
  });

export const onpremCommand = new Command()
  .description("Collect data for the Codefresh OnPrem Installation")
  .option("-n, --namespace <namespace:string>", "The namespace where Codefresh OnPrem is installed", { required: false })
  .action((options) => {
    setupOnPrem(options.host);
  });

export const ossCommand = new Command()
  .description("Collect data for the Open Source ArgoCD")
  .option("-n, --namespace <namespace:string>", "The namespace where the OSS ArgoCD is installed", { required: false })
  .action((options) => {
    publishOSS(options.repo);
  });