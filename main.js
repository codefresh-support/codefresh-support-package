import { Command } from '@cliffy/command';
import * as cmd from './src/index.js';

await new Command()
    .name('cf-support')
    .version('__APP_VERSION__')
    .description('Tool to gather information for Codefresh Support')
    .command(
        'gitops',
        new Command()
            .description('Collect data for the Codefresh GitOps Runtime')
            .option('-n, --namespace <namespace:string>', 'The namespace where the GitOps Runtime is installed', {
                required: false,
            })
            .action((options) => {
                cmd.gitops(options.namespace);
            }),
    )
    .command(
        'pipelines',
        new Command()
            .description('Collect data for the Codefresh Pipelines Runtime')
            .option('-n, --namespace <namespace:string>', 'The namespace where the Pipelines Runtime is installed', {
                required: false,
            })
            .option('-r, --runtime <runtime:string>', 'The name of the Pipelines Runtime', { required: false })
            .action((options) => {
                cmd.pipelines(options.namespace, options.runtime);
            }),
    )
    .command(
        'onprem',
        new Command()
            .description('Collect data for the Codefresh OnPrem Installation')
            .option('-n, --namespace <namespace:string>', 'The namespace where Codefresh OnPrem is installed', {
                required: false,
            })
            .action((options) => {
                cmd.onprem(options.namespace);
            }),
    )
    .command(
        'oss',
        new Command()
            .description('Collect data for the Open Source ArgoCD')
            .option('-n, --namespace <namespace:string>', 'The namespace where the OSS ArgoCD is installed', {
                required: false,
            })
            .action((options) => {
                cmd.oss(options.namespace);
            }),
    )
    .parse(Deno.args);
