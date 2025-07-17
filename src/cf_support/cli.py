import click
from .commands import pipelines, gitops, onprem, oss

@click.group()
def cli():
    """Codefresh Support Package

    Tool to gather information for Codefresh Support
    """
    pass

# Add individual commands directly to the main 'cli' group
cli.add_command(pipelines.pipelines_command)
cli.add_command(gitops.gitops_command)
cli.add_command(onprem.onprem_command)
cli.add_command(oss.oss_command)

