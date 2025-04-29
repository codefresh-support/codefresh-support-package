from .codefresh import Codefresh
from .k8s import K8s
from ..utils import network


class Pipeline(Codefresh, K8s):
    def __init__(self):
        super().__init__()
        super(K8s, self).__init__()

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
        self.k8s_resources = {
            "configmaps": self.core_v1.list_namespaced_config_map(
                namespace=self.namespace
            ).to_dict(),
            "daemonsets": self.apps_v1.list_namespaced_daemon_set(
                namespace=self.namespace
            ).to_dict(),
            "deployments": self.apps_v1.list_namespaced_deployment(
                namespace=self.namespace
            ).to_dict(),
            "jobs": self.batch_v1.list_namespaced_job(
                namespace=self.namespace
            ).to_dict(),
            "nodes": self.core_v1.list_node().to_dict(),
            "pods": self.core_v1.list_namespaced_pod(
                namespace=self.namespace
            ).to_dict(),
            "serviceaccounts": self.core_v1.list_namespaced_service_account(
                namespace=self.namespace
            ).to_dict(),
            "services": self.core_v1.list_namespaced_service(
                namespace=self.namespace
            ).to_dict(),
            "statefulsets": self.apps_v1.list_namespaced_stateful_set(
                namespace=self.namespace
            ).to_dict(),
            "cronjobs": self.batch_v1.list_namespaced_cron_job(
                namespace=self.namespace
            ).to_dict(),
            "persistentvolumeclaims": self.core_v1.list_namespaced_persistent_volume_claim(
                namespace=self.namespace
            ).to_dict(),
            "persistentvolumes": self.core_v1.list_persistent_volume().to_dict(),
            "storageclasses": self.storage_vi.list_storage_class().to_dict(),
        }
