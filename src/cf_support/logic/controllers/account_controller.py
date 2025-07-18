import requests


class AccountController:
    def __init__(self, cf_creds: dict[str, dict[str, str]]) -> None:
        self.base_url = cf_creds["base_url"]
        self.auth_headers = cf_creds["headers"]

    def get_runtimes(self):
        response = requests.get(
            f"{self.base_url}/runtime-environments",
            headers=self.auth_headers["headers"],  # type: ignore
        )
        return response.json()
