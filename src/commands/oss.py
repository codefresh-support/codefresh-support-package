import click

@click.command(name='oss') # Use @click.command() directly
@click.option('-n','--namespace', help='The namespace where the OSS ArgoCD is installed')
def oss_command(namespace):
    """Collect data for the Open Source ArgoCD"""
    
    click.echo(f"Executing pipelines command with filter: {filter if filter else 'none'}")
    # Add your core logic for the 'pipelines' command here.
    # This might involve calling functions from 'utils.py' or directly performing actions.