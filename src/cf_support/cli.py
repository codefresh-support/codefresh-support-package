import click
import importlib.metadata
from .commands import pipelines, gitops, onprem, oss

try:
    __version__ = importlib.metadata.version("cf-support")
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0+dev"

@click.group()
@click.version_option(version=__version__, prog_name="cf-support")
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

