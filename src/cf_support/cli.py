import click
from .commands import cmd_gitops, cmd_onprem, cmd_oss, cmd_pipelines, cmd_version


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
    cmd_gitops.execute(namespace=namespace)


@cli.command()
@click.option(
    "--namespace", "-n", help="The namespace where the pipelines runtime is installed"
)
def pipelines(namespace):
    """Collects Data for the Pipelines Runtime"""
    cmd_pipelines.execute(namespace=namespace)


@cli.command()
@click.option(
    "--namespace", "-n", help="The namespace where Codefresh On-Prem is installed"
)
def onprem(namespace):
    """Collects Data for the Codefresh On-Prem"""
    cmd_onprem.execute(namespace=namespace)


@cli.command()
@click.option("--namespace", "-n", help="The namespace where ArgoCD is installed")
def oss(namespace):
    """Collects Data for the Open Source Argo"""
    cmd_oss.execute(namespace=namespace)


@cli.command()
def version():
    """Prints the current version of the Codefresh Support Package tool"""
    cmd_version.execute()


if __name__ == "__main__":
    cli()
