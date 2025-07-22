import click

@click.command(name='gitops') # Use @click.command() directly
@click.option('-n','--namespace', help='The namespace where the GitOps Runtime is installed')
def gitops_command(namespace):
    """Collect data for the Codefresh GitOps Runtime"""
    
    click.echo(f"Executing pipelines command with filter: {filter if filter else 'none'}")
    # Add your core logic for the 'pipelines' command here.
    # This might involve calling functions from 'utils.py' or directly performing actions.