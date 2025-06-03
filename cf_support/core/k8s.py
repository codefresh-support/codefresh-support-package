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


def sanitize_data(data):
    if isinstance(data, dict):
        data["metadata"].pop("managedFields", None)
        return data
    else:
        data.metadata.managed_fields = None
        return data.to_dict()


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
        if version == None:
            return None
        data = crds.list_namespaced_custom_object(
            group=group,
            plural=plural,
            version=version,
            namespace=namespace,
        )["items"]
        return list(map(sanitize_data, data))
    except Exception as e:
        return None


def get_pod_events(events, pod_name):
    pod_events = [
        event
        for event in events
        if event.involved_object.name == pod_name
        and event.involved_object.kind == "Pod"
    ]
    event_messages = "\n".join(
        f"{event.creation_timespamp} /t{event.type} /t{event.reason} /t{event.name} /t{event.kind} /t{event.message} /t{event.source} /t{event.count}"
        for event in pod_events
    )
    return event_messages


def get_pod_data(namespace, events):
    core_v1 = client.CoreV1Api()
    pods = core_v1.list_namespaced_pod(namespace=namespace).items

    pod_data = []
    for pod in pods:
        pod = sanitize_data(pod)
        pod_events = get_pod_events(events, pod["metadata"]["name"])
        pod_logs = {}
        for container in pod["spec"]["containers"]:
            container_name = container["name"]
            try:
                log = core_v1.read_namespaced_pod_log(
                    name=container_name,
                    namespace=namespace,
                    container=container_name,
                )
                pod_logs[container_name] = log
            except client.ApiException as e:
                pod_logs[container_name] = f"Error fetching logs: {e}"

        pod_data.append({"pod": pod, "logs": pod_logs, "events": pod_events})
    return pod_data


def get_k8s_resources(namespace):
    apps_v1 = client.AppsV1Api()
    core_v1 = client.CoreV1Api()
    batch_v1 = client.BatchV1Api()
    storage_vi = client.StorageV1Api()

    events = sorted(
        core_v1.list_namespaced_event(namespace=namespace).items,
        key=lambda event: event.metadata.creation_timestamp,
    )

    pods = get_pod_data(namespace, events)

    k8s_resources = {
        "configmaps": list(
            map(
                sanitize_data,
                core_v1.list_namespaced_config_map(namespace=namespace).items,
            )
        ),
        "cronjobs.batch": list(
            map(
                sanitize_data,
                batch_v1.list_namespaced_cron_job(namespace=namespace).items,
            )
        ),
        "daemonsets.apps": list(
            map(
                sanitize_data,
                apps_v1.list_namespaced_daemon_set(namespace=namespace).items,
            )
        ),
        "deployments.apps": list(
            map(
                sanitize_data,
                apps_v1.list_namespaced_deployment(namespace=namespace).items,
            )
        ),
        "events.events.k8s.io": events,
        "jobs.batch": list(
            map(sanitize_data, batch_v1.list_namespaced_job(namespace=namespace).items)
        ),
        "nodes": list(map(sanitize_data, core_v1.list_node().items)),
        "persistentvolumeclaims": list(
            map(
                sanitize_data,
                core_v1.list_namespaced_persistent_volume_claim(
                    namespace=namespace
                ).items,
            )
        ),
        "persistentvolumes": list(
            map(sanitize_data, core_v1.list_persistent_volume().items)
        ),
        "pods": pods,
        "replicasets.apps": list(
            map(
                sanitize_data,
                apps_v1.list_namespaced_replica_set(namespace=namespace).items,
            )
        ),
        "serviceaccounts": list(
            map(
                sanitize_data,
                core_v1.list_namespaced_service_account(namespace=namespace).items,
            )
        ),
        "services": list(
            map(
                sanitize_data,
                core_v1.list_namespaced_service(namespace=namespace).items,
            )
        ),
        "statefulsets.apps": list(
            map(
                sanitize_data,
                apps_v1.list_namespaced_stateful_set(namespace=namespace).items,
            )
        ),
        "storageclasses.storage.k8s.io": list(
            map(sanitize_data, storage_vi.list_storage_class().items)
        ),
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

    return k8s_resources
