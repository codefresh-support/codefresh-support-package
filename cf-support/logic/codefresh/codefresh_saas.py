from ...utils.make_requests import make_request


def get_runtimes(cf_config):
    """
    Get the Runtimes for the Codefresh SaaS account.
    """

    results = make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/runtime-environments",
    )
    return results
