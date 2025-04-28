import platform
import os
import yaml
import logging
from utils import network


def get_creds():

    cf_api_key = os.getenv("CF_API_KEY")
    cf_url = os.getenv("CF_URL")

    if cf_api_key and cf_url:
        return {
            "base_url": f"{cf_url}/api",
            "api_key": cf_api_key,
        }

    if platform.system() == "Windows":
        config_path = os.path.join(os.getenv("USERPROFILE"), ".cfconfig")
    else:
        config_path = os.path.join(os.getenv("HOME"), ".cfconfig")

    try:
        with open(config_path, "r") as config_file:
            config = yaml.safe_load(config_file)
            current_context = config["contexts"][config["current-context"]]
            cf_api_key = current_context["token"]
            cf_url = current_context["url"]

            return {
                "base_url": f"{cf_url}/api",
                "api_key": cf_api_key,
            }
    except Exception as err:
        logging.error(f"Error reading .cfconfig file: {err}")

    return {
        "base_url": None,
        "api_key": None,
    }


def get_saas_runtimes(cf_config):
    """
    Get the Runtimes for the Codefresh SaaS account.
    """

    results = network.make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/runtime-environments",
    )
    return results


def get_onprem_accounts(cf_config):
    """
    Get Accounts from the Codefresh On-Prem Installation.
    """

    results = network.make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/admin/accounts",
    )
    return results


def get_onprem_runtimes(cf_config):
    """
    Get the Runtimes for the Codefresh On-Prem Installation.
    """

    results = network.make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/admin/runtime-environments",
    )
    return results


def get_onprem_feature_flags(cf_config):
    """
    Get the Feature Flags for the Codefresh On-Prem Installation.
    """

    results = network.make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/admin/features",
    )
    return results


def get_onprem_total_users(cf_config):
    """
    Get the total amount of users for the Codefresh On-Prem Installation.
    """

    results = network.make_request(
        cf_config["base_url"],
        cf_config["api_key"],
        "/admin/user?limit=1&page=1",
    )
    return results["total"]
