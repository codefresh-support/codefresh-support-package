import platform
import os
import yaml


class Codefresh:

    def __init__(self):
        self.base_url = None
        self.api_key = None

    def set_creds(self):

        cf_api_key = os.getenv("CF_API_KEY")
        cf_url = os.getenv("CF_URL")

        if cf_api_key and cf_url:
            self.base_url = f"{cf_url}/api"
            self.api_key = cf_api_key
            return

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

                self.base_url = f"{cf_url}/api"
                self.api_key = cf_api_key
        except Exception as err:
            print(f"Error reading .cfconfig file: {err}")
