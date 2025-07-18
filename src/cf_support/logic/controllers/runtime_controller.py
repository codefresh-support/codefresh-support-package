import requests


class RuntimeController:
    def __init__(self, cf_creds: dict[str, dict[str, str]]) -> None:
        self.base_url = cf_creds["base_url"]
        self.auth_headers = cf_creds["headers"]

    def get_spec(self, runtime_name: str):
        response = requests.get(
            f"{self.base_url}/runtime-environments/{runtime_name}",
            headers=self.auth_headers,
        )
        return response.json()
