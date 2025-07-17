import click

@click.command(name='pipelines') # Use @click.command() directly
@click.option('-n','--namespace', help='The namespace where the Pipelines Runtime is installed')
@click.option('-r','--runtime', help='The name of the Pipelines Runtime')
def pipelines_command(namespace, runtime):
    """Collect data for the Codefresh Pipelines Runtime"""
    
    click.echo(f"Executing pipelines command with filter: {filter if filter else 'none'}")
    # Add your core logic for the 'pipelines' command here.
    # This might involve calling functions from 'utils.py' or directly performing actions.