import click
from .commands import pipelines, gitops, onprem, oss

try:
    from ._version import version as __version__
except ImportError:
    __version__ = "0.0.0+dev.uninstalled"

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

