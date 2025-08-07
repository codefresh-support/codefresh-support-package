import os
import yaml
import requests
from utilities.logger_config import setup_logger
from urllib.parse import quote

logger = setup_logger(__name__)


class Codefresh:
    def __init__(self):
        logger.debug(f"{self.__class__.__name__} initialized")

    def get_credentials(self):
        logger.info(f"{self.__class__.__name__} is getting CF credentials")
        env_token = os.getenv("CF_API_KEY")
        env_url = os.getenv("CF_URL")
        cf_creds = None

        if env_token and env_url:
            cf_creds = {
                "headers": {"Authorization": env_token},
                "base_url": f"{env_url}/api",
            }

        # Determine config path based on OS
        config_path = os.path.join(
            os.getenv("USERPROFILE" if os.name == "nt" else "HOME", ""), ".cfconfig"
        )

        try:
            with open(config_path, "r") as file:
                config_content = file.read()
                config = yaml.safe_load(config_content)
                current_context = config["contexts"][config["current-context"]]

                if current_context:
                    cf_creds = {
                        "headers": {"Authorization": current_context["token"]},
                        "base_url": f"{current_context['url']}/api",
                    }
        except:
            pass

        return cf_creds

    def get_account_runtimes(self, cf_creds):
        logger.info(f"{self.__class__.__name__} is getting account runtimes")
        response = requests.get(
            f"{cf_creds['base_url']}/runtime-environments", headers=cf_creds["headers"]
        )
        response.raise_for_status()
        return response.json()

    def get_account_runtime_spec(self, cf_creds, runtime_name):
        logger.info(
            f"{self.__class__.__name__} is getting runtime spec for runtime '{runtime_name}'"
        )
        response = requests.get(
            f"{cf_creds['base_url']}/runtime-environments/{quote(runtime_name)}",
            headers=cf_creds["headers"],
        )
        response.raise_for_status()
        return response.json()

    def get_system_accounts(self, cf_creds):
        logger.info(f"{self.__class__.__name__} is getting all accounts")
        response = requests.get(
            f"{cf_creds['base_url']}/admin/accounts", headers=cf_creds["headers"]
        )
        response.raise_for_status()
        return response.json()

    def get_system_runtimes(self, cf_creds):
        logger.info(
            f"{self.__class__.__name__} is getting all runtimes (cross-account)"
        )
        response = requests.get(
            f"{cf_creds['base_url']}/admin/runtime-environments",
            headers=cf_creds["headers"],
        )
        response.raise_for_status()
        return response.json()

    def get_system_total_users(self, cf_creds):
        logger.info(f"{self.__class__.__name__} is getting total users (cross-account)")
        response = requests.get(
            f"{cf_creds['base_url']}/admin/user?limit=1&page=1",
            headers=cf_creds["headers"],
        )
        response.raise_for_status()
        users = response.json()
        return {"totalUsers": users["total"]}

    def get_system_feature_flags(self, cf_creds):
        logger.info(f"{self.__class__.__name__} is getting feature flags")
        response = requests.get(
            f"{cf_creds['base_url']}/admin/features", headers=cf_creds["headers"]
        )
        response.raise_for_status()
        return response.json()
