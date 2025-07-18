import requests


class SystemController:
    def __init__(self, cf_creds: dict[str, dict[str, str]]) -> None:
        self.base_url = cf_creds["base_url"]
        self.auth_headers = cf_creds["headers"]

    def get_all_accounts(self):
        response = requests.get(
            f"{self.base_url}/admin/accounts",
            headers=self.auth_headers,
        )
        return response.json()

    def get_all_runtimes(self):
        response = requests.get(
            f"{self.base_url}/admin/runtime-environments",
            headers=self.auth_headers,
        )
        return response.json()

    def get_feature_flags(self):
        response = requests.get(
            f"{self.base_url}/admin/features",
            headers=self.auth_headers,
        )
        return response.json()

    def get_total_users(self):
        response = requests.get(
            f"{self.base_url}/admin/user?limit=1&page=1",
            headers=self.auth_headers,
        )
        users = response.json()

        return {"totalUsers": users["total"]}
