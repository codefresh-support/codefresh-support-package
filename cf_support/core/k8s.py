from kubernetes import client, config
import urllib3

# removes TLS warnings about unverified HTTPS requests
urllib3.disable_warnings()
# loads the kubenetes config
config.load_kube_config()


def select_namespace():

    core_v1 = client.CoreV1Api()
    namespaces = core_v1.list_namespace()
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

    return namespace_list[selection - 1]


def get_crd_version(group, plural):
    apiextensions_v1 = client.ApiextensionsV1Api(client.ApiClient())
    name = f"{plural}.{group}"

    try:
        crd = apiextensions_v1.read_custom_resource_definition(name=name)
        for version in crd.spec.versions:
            if version.storage:
                return version.name
        # If no stored version is explicitly marked, return the first one
        if crd.spec.versions:
            return crd.spec.versions[0].name
    except client.ApiException as e:
        return None


def get_crd_object(group, plural, namespace):
    crds = client.CustomObjectsApi()
    try:
        version = get_crd_version(group=group, plural=plural)
        return crds.list_namespaced_custom_object(
            group=group,
            plural=plural,
            version=version,
            namespace=namespace,
        )["items"]
    except Exception as e:
        return None


def get_pod_logs(pod):
    core_v1 = client.CoreV1Api()
    logs = {}

    for container in pod["spec"]["containers"]:
        container_name = container["name"]

        try:
            log = core_v1.read_namespaced_pod_log(
                name=pod["metadata"]["name"],
                namespace=pod["metadata"]["namespace"],
                container=container_name,
            )
            logs[container_name] = log
        except client.ApiException as e:
            logs[container_name] = (
                f"Error fetching logs for pod '{pod["metadata"]["name"]}': {e}"
            )

    return logs


def get_k8s_resources(namespace):
    core_v1 = client.CoreV1Api()
    batch_v1 = client.BatchV1Api()
    storage_vi = client.StorageV1Api()

    return {
        "pods": core_v1.list_namespaced_pod(namespace=namespace).to_dict()["items"],
        "events": sorted(
            core_v1.list_namespaced_event(namespace=namespace).to_dict()["items"],
            key=lambda event: event["metadata"]["creation_timestamp"],
        ),
        "configmaps": core_v1.list_namespaced_config_map(namespace=namespace).to_dict()[
            "items"
        ],
        "jobs": batch_v1.list_namespaced_job(namespace=namespace).to_dict()["items"],
        "nodes": core_v1.list_node().to_dict()["items"],
        "services": core_v1.list_namespaced_service(namespace=namespace).to_dict()[
            "items"
        ],
        "cronjobs": batch_v1.list_namespaced_cron_job(namespace=namespace).to_dict()[
            "items"
        ],
        "persistentvolumeclaims": core_v1.list_namespaced_persistent_volume_claim(
            namespace=namespace
        ).to_dict()["items"],
        "persistentvolumes": core_v1.list_persistent_volume().to_dict()["items"],
        "storageclasses": storage_vi.list_storage_class().to_dict()["items"],
        "products.codefresh.io": get_crd_object("codefresh.io", "products", namespace),
        "promotionflows.codefresh.io": get_crd_object(
            "codefresh.io", "promotionflows", namespace
        ),
        "promotionpolicies.codefresh.io": get_crd_object(
            "codefresh.io", "promotionpolicies", namespace
        ),
        "promotiontemplates.codefresh.io": get_crd_object(
            "codefresh.io", "promotiontemplates", namespace
        ),
        "restrictedgitsources.codefresh.io": get_crd_object(
            "codefresh.io", "restrictedgitsources", namespace
        ),
        "analysisruns.argoproj.io": get_crd_object(
            "argoproj.io", "analysisruns", namespace
        ),
        "analysistemplates.argoproj.io": get_crd_object(
            "argoproj.io", "analysistemplates", namespace
        ),
        "applications.argoproj.io": get_crd_object(
            "argoproj.io", "applications", namespace
        ),
        "applicationsets.argoproj.io": get_crd_object(
            "argoproj.io", "applicationsets", namespace
        ),
        "appprojects.argoproj.io": get_crd_object(
            "argoproj.io", "appprojects", namespace
        ),
        "eventbus.argoproj.io": get_crd_object("argoproj.io", "eventbus", namespace),
        "eventsources.argoproj.io": get_crd_object(
            "argoproj.io", "eventsources", namespace
        ),
        "experiments.argoproj.io": get_crd_object(
            "argoproj.io", "experiments", namespace
        ),
        "rollouts.argoproj.io": get_crd_object("argoproj.io", "rollouts", namespace),
        "sensors.argoproj.io": get_crd_object("argoproj.io", "sensors", namespace),
    }
