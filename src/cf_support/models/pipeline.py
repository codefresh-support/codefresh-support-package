from .k8s import K8s
from ..utils import network
import platform
import os
import yaml


class Pipeline(K8s):
    def __init__(self):
        super().__init__()
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

    def get_runtime_spec(self):
        runtimes = network.make_request(
            self.base_url,
            self.api_kiy,
            "/runtime-environments",
        )

        if len(runtimes) != 0:
            for index, runtime in enumerate(runtimes, start=1):
                print(f"{index}. {runtime['metadata']['name']}")

            while True:
                try:
                    selection = int(
                        input(
                            "\nPlease select the runtime to gather data from (Number): "
                        )
                    )
                    if 1 <= selection <= len(runtimes):
                        break
                    else:
                        print("Invalid selection. Please enter a valid number.")
                except ValueError:
                    print("Invalid input. Please enter a valid number.")

            re_spec = runtimes[selection - 1]
            return re_spec
        else:
            return {"Error": "No runtimes found in the Codefresh account."}

    def set_k8s_resources(self):
        base_resources = super().get_resources()
        additonal_resources = {
            "cronjobs": self.batch_v1.list_namespaced_cron_job(
                namespace=self.namespace
            ).to_dict(),
            "persistentvolumeclaims": self.core_v1.list_namespaced_persistent_volume_claim(
                namespace=self.namespace
            ).to_dict(),
            "persistentvolumes": self.core_v1.list_persistent_volume().to_dict(),
            "storageclasses": self.storage_vi.list_storage_class().to_dict(),
        }
        return {**base_resources, **additonal_resources}
