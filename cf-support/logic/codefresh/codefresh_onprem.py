from ...utils.make_requests import make_request


def get_accounts(cf_config):
    """
    Get Accounts from the Codefresh On-Prem Installation.
    """

    results = make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/admin/accounts",
    )
    return results


def get_runtimes(cf_config):
    """
    Get the Runtimes for the Codefresh On-Prem Installation.
    """

    results = make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/admin/runtime-environments",
    )
    return results


def get_feature_flags(cf_config):
    """
    Get the Feature Flags for the Codefresh On-Prem Installation.
    """

    results = make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/admin/features",
    )
    return results


def get_total_users(cf_config):
    """
    Get the total amount of users for the Codefresh On-Prem Installation.
    """

    results = make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/admin/user?limit=1&page=1",
    )
    return results["total"]
