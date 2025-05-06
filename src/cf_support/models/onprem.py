from .pipeline import Pipeline
from ..utils import network


class OnPrem(Pipeline):
    def __init__(self):
        super().__init__()

    def get_accounts(self):
        results = network.make_request(
            self.base_url,
            self.api_key,
            "/admin/accounts",
        )
        return results

    def get_runtimes(self):
        results = network.make_request(
            self.base_url,
            self.api_key,
            "/admin/runtime-environments",
        )
        return results

    def get_feature_flags(self):
        results = network.make_request(
            self.base_url,
            self.api_key,
            "/admin/features",
        )
        return results

    def get_total_users(self):
        results = network.make_request(
            self.base_url,
            self.api_key,
            "/admin/user?limit=1&page=1",
        )
        return results["total"]
