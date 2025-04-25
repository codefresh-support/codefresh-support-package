import platform
import os
import yaml
import logging


def get_creds():
    """
    Get Codefresh credentials from environment variables or system-specific locations.
    """

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
