from kubernetes import client, config
from kubernetes.client.rest import ApiException
from datetime import datetime
from utilities.logger_config import setup_logger

logger = setup_logger(__name__)


class K8s:
    def __init__(self):
        logger.debug(f"{self.__class__.__name__} initialized")
        # Load kubeconfig
        try:
            config.load_kube_config()
        except:
            # Fallback to in-cluster config if kubeconfig not available
            config.load_incluster_config()

        self.appsApi = client.AppsV1Api()
        self.batchApi = client.BatchV1Api()
        self.coreApi = client.CoreV1Api()
        self.crdApi = client.CustomObjectsApi()
        self.apiExtensions = client.ApiextensionsV1Api()
        self.storageApi = client.StorageV1Api()

    def select_namespace(self):
        logger.info(f"{self.__class__.__name__} Interactive namespace selection")
        try:
            namespaces_response = self.coreApi.list_namespace()
            namespaces = [ns.metadata.name for ns in namespaces_response.items]

            for index, namespace in enumerate(namespaces):
                print(f"{index + 1}. {namespace}")

            while True:
                try:
                    selection = int(input("\nWhich Namespace are we using? (Number): "))
                    if 1 <= selection <= len(namespaces):
                        return namespaces[selection - 1]
                    else:
                        print(
                            "Invalid selection. Please enter a number corresponding to one of the listed namespaces."
                        )
                except ValueError:
                    print(
                        "Invalid selection. Please enter a number corresponding to one of the listed namespaces."
                    )

        except ApiException as error:
            print(f"Error fetching namespaces: {error}")
            raise

    def get_pod_logs(self, pod):
        logger.info(f"{self.__class__.__name__} Get logs from all containers in a pod")
        pod_name = pod.metadata.name
        namespace = pod.metadata.namespace
        containers = [container.name for container in pod.spec.containers]
        logs = {}

        for container in containers:
            try:
                log_response = self.coreApi.read_namespaced_pod_log(
                    name=pod_name,
                    namespace=namespace,
                    container=container,
                    timestamps=True,
                )
                logs[container] = log_response
            except ApiException as error:
                logs[container] = f"Error: {str(error)}"

        return logs

    def get_crd(self, crd_type, namespace):
        logger.info(
            f"{self.__class__.__name__} Get custom resource definition objects for {crd_type}"
        )
        try:
            # Get the CRD definition
            crd = self.apiExtensions.read_custom_resource_definition(crd_type)

            # Find the served version
            served_version = None
            for version in crd.spec.versions:
                if version.served:
                    served_version = version.name
                    break

            # Get custom resources using the CustomObjectsApi
            crd_List = self.crdApi.list_namespaced_custom_object(
                group=crd.spec.group,
                version=served_version,
                namespace=namespace,
                plural=crd.spec.names.plural,
            )

            return crd_List

        except:
            return None

    def get_sorted_events(self, namespace):
        logger.info(
            f"{self.__class__.__name__} Get events sorted by creation timestamp"
        )
        try:
            events = self.coreApi.list_namespaced_event(namespace=namespace)

            # Sort events by creation timestamp
            events.items.sort(
                key=lambda event: (event.metadata.creation_timestamp or datetime.min)
            )

            return events

        except:
            return None

    def get_resources(self, namespace):
        logger.info(
            f"{self.__class__.__name__} Get dictionary of resource types and their corresponding API calls"
        )
        k8s_resource_types = {
            "configmaps": lambda: self.coreApi.list_namespaced_config_map(
                namespace=namespace
            ),
            "cronjobs.batch": lambda: self.batchApi.list_namespaced_cron_job(
                namespace=namespace
            ),
            "daemonsets.apps": lambda: self.appsApi.list_namespaced_daemon_set(
                namespace=namespace
            ),
            "deployments.apps": lambda: self.appsApi.list_namespaced_deployment(
                namespace=namespace
            ),
            "events.k8s.io": lambda: self.get_sorted_events(namespace),
            "jobs.batch": lambda: self.batchApi.list_namespaced_job(
                namespace=namespace
            ),
            "nodes": lambda: self.coreApi.list_node(),
            "pods": lambda: self.coreApi.list_namespaced_pod(namespace=namespace),
            "serviceaccounts": lambda: self.coreApi.list_namespaced_service_account(
                namespace=namespace
            ),
            "services": lambda: self.coreApi.list_namespaced_service(
                namespace=namespace
            ),
            "statefulsets.apps": lambda: self.appsApi.list_namespaced_stateful_set(
                namespace=namespace
            ),
            "persistentvolumeclaims": lambda: self.coreApi.list_namespaced_persistent_volume_claim(
                namespace=namespace, label_selector="io.codefresh.accountName"
            ),
            "persistentvolumes": lambda: self.coreApi.list_persistent_volume(
                label_selector="io.codefresh.accountName"
            ),
            "storageclasses.storage.k8s.io": lambda: self.storageApi.list_storage_class(),
            "products.codefresh.io": lambda: self.get_crd(
                "products.codefresh.io", namespace
            ),
            "promotionflows.codefresh.io": lambda: self.get_crd(
                "products.codefresh.io", namespace
            ),
            "promotionpolicies.codefresh.io": lambda: self.get_crd(
                "promotionflows.codefresh.io", namespace
            ),
            "promotiontemplates.codefresh.io": lambda: self.get_crd(
                "promotiontemplates.codefresh.io", namespace
            ),
            "restrictedgitsources.codefresh.io": lambda: self.get_crd(
                "restrictedgitsources.codefresh.io", namespace
            ),
            "analysisruns.argoproj.io": lambda: self.get_crd(
                "analysisruns.argoproj.io", namespace
            ),
            "analysistemplates.argoproj.io": lambda: self.get_crd(
                "analysistemplates.argoproj.io", namespace
            ),
            "applications.argoproj.io": lambda: self.get_crd(
                "applications.argoproj.io", namespace
            ),
            "applicationsets.argoproj.io": lambda: self.get_crd(
                "applicationsets.argoproj.io", namespace
            ),
            "appprojects.argoproj.io": lambda: self.get_crd(
                "appprojects.argoproj.io", namespace
            ),
            "eventbus.argoproj.io": lambda: self.get_crd(
                "eventbus.argoproj.io", namespace
            ),
            "eventsources.argoproj.io": lambda: self.get_crd(
                "eventsources.argoproj.io", namespace
            ),
            "experiments.argoproj.io": lambda: self.get_crd(
                "experiments.argoproj.io", namespace
            ),
            "rollouts.argoproj.io": lambda: self.get_crd(
                "rollouts.argoproj.io", namespace
            ),
            "sensors.argoproj.io": lambda: self.get_crd(
                "sensors.argoproj.io", namespace
            ),
        }

        return k8s_resource_types
