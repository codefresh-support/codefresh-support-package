from utilities.logger_config import setup_logger
import requests

logger = setup_logger(__name__)


class RuntimeController:
    def __init__(self, cf_creds: dict[str, dict[str, str]]) -> None:
        logger.debug(f"{self.__class__.__name__} initialized")
        self.base_url = cf_creds["base_url"]
        self.auth_headers = cf_creds["headers"]

    def get_spec(self, runtime_name: str):
        logger.info(
            f"{self.__class__.__name__} is getting runtime spec for runtime '{runtime_name}'"
        )
        response = requests.get(
            f"{self.base_url}/runtime-environments/{runtime_name}",
            headers=self.auth_headers,
        )
        return response.json()
