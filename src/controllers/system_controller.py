from utilities.logger_config import setup_logger
import requests

logger = setup_logger(__name__)


class SystemController:
    def __init__(self, cf_creds: dict[str, dict[str, str]]) -> None:
        logger.debug(f"{self.__class__.__name__} initialized")
        self.base_url = cf_creds["base_url"]
        self.auth_headers = cf_creds["headers"]

    def get_all_accounts(self):
        logger.info(f"{self.__class__.__name__} is getting all accounts")
        response = requests.get(
            f"{self.base_url}/admin/accounts",
            headers=self.auth_headers,
        )
        return response.json()

    def get_all_runtimes(self):
        logger.info(f"{self.__class__.__name__} is getting all runtimes (cross-account)")
        response = requests.get(
            f"{self.base_url}/admin/runtime-environments",
            headers=self.auth_headers,
        )
        return response.json()

    def get_feature_flags(self):
        logger.info(f"{self.__class__.__name__} is getting feature flags")
        response = requests.get(
            f"{self.base_url}/admin/features",
            headers=self.auth_headers,
        )
        return response.json()

    def get_total_users(self):
        logger.info(f"{self.__class__.__name__} is getting total users (cross-account)")
        response = requests.get(
            f"{self.base_url}/admin/user?limit=1&page=1",
            headers=self.auth_headers,
        )
        users = response.json()

        return {"totalUsers": users["total"]}
