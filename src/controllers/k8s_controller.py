from typing import Dict, Optional, Any
from kubernetes import client, config # type: ignore
from kubernetes.client.rest import ApiException # type: ignore


class K8sController:
    def __init__(self):
        """Initialize Kubernetes client with auto-detected configuration."""
        
        try:
            # Try to load in-cluster config first, then kubeconfig
            config.load_incluster_config() # type: ignore
        except config.ConfigException:
            config.load_kube_config() # type: ignore
        
        self.core_api = client.CoreV1Api()
        self.apps_api = client.AppsV1Api()
        self.batch_api = client.BatchV1Api()
        self.storage_api = client.StorageV1Api()
        self.crd_api = client.ApiextensionsV1Api()
        self.custom_objects_api = client.CustomObjectsApi()

    def select_namespace(self) -> str:
        """Interactive namespace selection."""
        namespaces: list[str] = [ns.metadata.name for ns in self.core_api.list_namespace().items] # type: ignore
        
        for index, namespace in enumerate(namespaces, 1):
            print(f"{index}. {namespace}")
        
        while True:
            try:
                selection = int(input('\nWhich Namespace are we using? (Number): '))
                if 1 <= selection <= len(namespaces):
                    return namespaces[selection - 1]
                else:
                    print('Invalid selection. Please enter a number corresponding to one of the listed namespaces.')
            except ValueError:
                print('Invalid selection. Please enter a number corresponding to one of the listed namespaces.')

    def get_pod_logs(self, pod: Dict[str, Any]) -> Dict[str, str]:
        """Get logs for all containers in a pod."""
        pod_name = pod['metadata']['name']
        namespace = pod['metadata']['namespace']
        containers = [container['name'] for container in pod['spec']['containers']]
        
        logs: Dict[str, str] = {}
        for container in containers:
            try:
                logs[container] = self.core_api.read_namespaced_pod_log(name=pod_name, namespace=namespace, container=container, timestamps=True ) # type: ignore
            except ApiException as error:
                logs[container] = str(error)
        
        return logs

    def _get_crd(self, crd_type: str, namespace: str) -> Optional[Dict[str, Any]]:
        """Get Custom Resource Definition objects."""
        try:
            crd = self.crd_api.read_custom_resource_definition(crd_type)
            
            # Find served version
            served_version = next(
                (v.name for v in crd.spec.versions if v.served), 
                None
            )
            
            if not served_version:
                return None
            
            # Get custom resources
            response = self.custom_objects_api.list_namespaced_custom_object(
                group=crd.spec.group,
                version=served_version,
                namespace=namespace,
                plural=crd.spec.names.plural
            )
            
            return response
        except ApiException:
            return None

    def _get_sorted_events(self, namespace: str) -> client.V1EventList:
        """Get events sorted by creation timestamp."""
        events = self.core_api.list_namespaced_event(namespace)
        
        # Sort events by creation timestamp
        events.items.sort(
            key=lambda event: event.metadata.creation_timestamp
        )
        
        return events

    def fetch_all_resources(self, namespace: str) -> Dict[str, Any]:
        """Fetch all Kubernetes resources for a namespace."""

        k8s_resource_types = {
            'configmaps': lambda: self.core_api.list_namespaced_config_map(namespace), # type: ignore
            'cronjobs.batch': lambda: self.batch_api.list_namespaced_cron_job(namespace), # type: ignore
            'daemonsets.apps': lambda: self.apps_api.list_namespaced_daemon_set(namespace), # type: ignore
            'deployments.apps': lambda: self.apps_api.list_namespaced_deployment(namespace), # type: ignore
            'events.k8s.io': lambda: self._get_sorted_events(namespace), # type: ignore
            'jobs.batch': lambda: self.batch_api.list_namespaced_job(namespace), # type: ignore
            'nodes': lambda: self.core_api.list_node(), # type: ignore
            'pods': lambda: self.core_api.list_namespaced_pod(namespace), # type: ignore
            'serviceaccounts': lambda: self.core_api.list_namespaced_service_account(namespace), # type: ignore
            'services': lambda: self.core_api.list_namespaced_service(namespace), # type: ignore
            'statefulsets.apps': lambda: self.apps_api.list_namespaced_stateful_set(namespace), # type: ignore
            'persistentvolumeclaims': lambda: self.core_api.list_namespaced_persistent_volume_claim( # type: ignore
                namespace, label_selector='io.codefresh.accountName'
            ),
            'persistentvolumes': lambda: self.core_api.list_persistent_volume( # type: ignore
                label_selector='io.codefresh.accountName'
            ),
            'storageclasses.storage.k8s.io': lambda: self.storage_api.list_storage_class(), # type: ignore
            
            # Codefresh CRDs
            'products.codefresh.io': lambda: self._get_crd('products.codefresh.io', namespace),
            'promotionflows.codefresh.io': lambda: self._get_crd('promotionflows.codefresh.io', namespace),
            'promotionpolicies.codefresh.io': lambda: self._get_crd('promotionpolicies.codefresh.io', namespace),
            'promotiontemplates.codefresh.io': lambda: self._get_crd('promotiontemplates.codefresh.io', namespace),
            'restrictedgitsources.codefresh.io': lambda: self._get_crd('restrictedgitsources.codefresh.io', namespace),
            
            # ArgoProj CRDs
            'analysisruns.argoproj.io': lambda: self._get_crd('analysisruns.argoproj.io', namespace),
            'analysistemplates.argoproj.io': lambda: self._get_crd('analysistemplates.argoproj.io', namespace),
            'applications.argoproj.io': lambda: self._get_crd('applications.argoproj.io', namespace),
            'applicationsets.argoproj.io': lambda: self._get_crd('applicationsets.argoproj.io', namespace),
            'appprojects.argoproj.io': lambda: self._get_crd('appprojects.argoproj.io', namespace),
            'eventbus.argoproj.io': lambda: self._get_crd('eventbus.argoproj.io', namespace),
            'eventsources.argoproj.io': lambda: self._get_crd('eventsources.argoproj.io', namespace),
            'experiments.argoproj.io': lambda: self._get_crd('experiments.argoproj.io', namespace),
            'rollouts.argoproj.io': lambda: self._get_crd('rollouts.argoproj.io', namespace),
            'sensors.argoproj.io': lambda: self._get_crd('sensors.argoproj.io', namespace),
        }
        resources = {}
        
        for resource_type, fetch_func in k8s_resource_types.items():
            try:
                print(f"Fetching {resource_type}...")
                resources[resource_type] = fetch_func()
            except ApiException as e:
                resources[resource_type] = None
        
        return resources