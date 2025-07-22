import click

@click.command(name='onprem') # Use @click.command() directly
@click.option('-n','--namespace', help='The namespace where Codefresh OnPrem is installed')
def onprem_command(namespace):
    """Collect data for the Codefresh OnPrem Installation"""
    
    click.echo(f"Executing pipelines command with filter: {filter if filter else 'none'}")
    # Add your core logic for the 'pipelines' command here.
    # This might involve calling functions from 'utils.py' or directly performing actions.