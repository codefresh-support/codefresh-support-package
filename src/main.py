from commands import pipelines, gitops, onprem, oss
from controllers.account_controller import AccountController
from controllers.auth_controller import AuthController
from controllers.runtime_controller import RuntimeController
from controllers.system_controller import SystemController
from dotenv import load_dotenv
from utilities.logger_config import setup_logger
import click
import os

load_dotenv()
logger = setup_logger(__name__)


logger.info("Starting CF Support CLI")
env_token = os.getenv("CF_API_KEY")
env_url = os.getenv("CF_URL")
auth_controller = AuthController(env_token, env_url)

try:
    from _version import version as __version__
except ImportError:
    __version__ = "0.0.0+dev.uninstalled"

@click.group()
@click.version_option(version=__version__, prog_name="cf-support")
def cli():
    """Codefresh Support Package

    Tool to gather information for Codefresh Support
    """
    pass

cli.add_command(pipelines.pipelines_command)
cli.add_command(gitops.gitops_command)
cli.add_command(onprem.onprem_command)
cli.add_command(oss.oss_command)


if __name__ == "__main__":
    cli()
