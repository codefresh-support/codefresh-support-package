from utilities.logger_config import setup_logger
import yaml
import os

logger = setup_logger(__name__)


class AuthController:
    def __init__(self, env_token: str | None, env_url: str | None) -> None:
        logger.debug(f"{self.__class__.__name__} initialized")
        self.env_token = env_token
        self.env_url = env_url

    def get_cf_credentials(
        self,
    ) -> dict[str, dict[str, str] | str] | None:
        logger.info(f"{self.__class__.__name__} is getting CF credentials")
        env_token = self.env_token
        env_url = self.env_url
        cf_credentials: dict[str, dict[str, str] | str] | None = None

        if env_token and env_url:
            auth_header: dict[str, str] = {"Authorization": env_token}

            cf_credentials = {
                "headers": auth_header,
                "base_url": f"{env_url}/api",
            }

        else:
            config_path = (
                f"{os.getenv('USERPROFILE')}/.cfconfig"
                if os.name == "nt"
                else f"{os.getenv('HOME')}/.cfconfig"
            )

            try:
                with open(config_path, "r") as config_file:
                    config = yaml.safe_load(config_file)

                current_context = config["contexts"].get(config["current-context"])
            except (FileNotFoundError, PermissionError, yaml.YAMLError):
                current_context = None

            if current_context:
                context_token = current_context["token"]
                context_url = current_context["url"]

                if context_token and context_url:
                    auth_header = {"Authorization": context_token}
                    cf_credentials = {
                        "headers": auth_header,
                        "base_url": f"{context_url}/api",
                    }

        return cf_credentials
