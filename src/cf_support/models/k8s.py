from kubernetes import client, config
import urllib3

# removes TLS warnings about unverified HTTPS requests
urllib3.disable_warnings()


class K8s:
    def __init__(self):
        config.load_kube_config()
        self.core_v1 = client.CoreV1Api()
        self.batch_v1 = client.BatchV1Api()
        self.storage_vi = client.StorageV1Api()
        self.crds = client.CustomObjectsApi()
        self.apiextensions_v1 = client.ApiextensionsV1Api(client.ApiClient())
        self.namespace = "default"

    def select_namespace(self):
        namespaces = self.core_v1.list_namespace()
        namespace_list = [ns.metadata.name for ns in namespaces.items]

        for index, namespace in enumerate(namespace_list, start=1):
            print(f"{index}. {namespace}")
        while True:
            try:
                selection = int(input(f"\nWhich namespace? (Number): "))
                if 1 <= selection <= len(namespace_list):
                    break
                else:
                    print(
                        "Invalid selection. Please enter a number corresponding to one of the listed namespaces."
                    )
            except ValueError:
                print("Invalid input. Please enter a valid number.")

        self.namespace = namespace_list[selection - 1]

    def get_crd_version(self, group, plural):
        name = f"{plural}.{group}"
        try:
            crd = self.apiextensions_v1.read_custom_resource_definition(name=name)
            for version in crd.spec.versions:
                if version.storage:
                    return version.name
            # If no stored version is explicitly marked, return the first one
            if crd.spec.versions:
                return crd.spec.versions[0].name
        except client.ApiException as e:
            print(f"Error getting CRD '{name}': {e}")

    def get_pod_logs(self, pod):

        logs = {}
        for container in pod["spec"]["containers"]:
            container_name = container["name"]

            try:
                log = self.core_v1.read_namespaced_pod_log(
                    name=pod["metadata"]["name"],
                    namespace=self.namespace,
                    container=container_name,
                )
                logs[container_name] = log
            except client.ApiException as e:
                logs[container_name] = (
                    f"Error fetching logs for pod '{pod["metadata"]["name"]}': {e}"
                )

        return logs

    def get_k8s_resources(self):
        pods = self.core_v1.list_namespaced_pod(namespace=self.namespace).to_dict()[
            "items"
        ]
        events = sorted(
            self.core_v1.list_namespaced_event(namespace=self.namespace).to_dict()[
                "items"
            ],
            key=lambda event: event["metadata"]["creation_timestamp"],
        )

        for pod in pods:
            pod_name = pod["metadata"]["name"]
            pod_events = [
                event
                for event in events
                if event["involved_object"]["name"] == pod_name
            ]
            pod["events"] = pod_events

        return {
            "configmaps": self.core_v1.list_namespaced_config_map(
                namespace=self.namespace
            ).to_dict()["items"],
            "events": events,
            "jobs": self.batch_v1.list_namespaced_job(
                namespace=self.namespace
            ).to_dict()["items"],
            "nodes": self.core_v1.list_node().to_dict()["items"],
            "pods": pods,
            "services": self.core_v1.list_namespaced_service(
                namespace=self.namespace
            ).to_dict()["items"],
        }
