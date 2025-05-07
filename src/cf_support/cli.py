import click
from . import commands


@click.group()
def cli():
    """Codefresh Support Package"""
    pass


@cli.command()
@click.option(
    "--namespace", "-n", help="The namespace where the gitops runtime is installed"
)
def gitops(namespace):
    """Collects Data for the GitOps Runtime"""
    commands.gitops.execute(namespace=namespace)


@cli.command()
@click.option(
    "--namespace", "-n", help="The namespace where the pipelines runtime is installed"
)
def pipelines(namespace):
    """Collects Data for the Pipelines Runtime"""
    commands.pipelines.execute(namespace=namespace)


@cli.command()
@click.option(
    "--namespace", "-n", help="The namespace where Codefresh On-Prem is installed"
)
def onprem(namespace):
    """Collects Data for the Codefresh On-Prem"""
    commands.onprem.execute(namespace=namespace)


@cli.command()
@click.option("--namespace", "-n", help="The namespace where ArgoCD is installed")
def oss(namespace):
    """Collects Data for the Open Source Argo"""
    commands.oss.execute(namespace=namespace)


@cli.command()
def version():
    """Prints the current version of the Codefresh Support Package tool"""
    commands.version.execute()


if __name__ == "__main__":
    cli()
