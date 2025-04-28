from kubernetes import client
import inspect
import logging


def select_namespace():

    v1 = client.CoreV1Api()
    namespaces = v1.list_namespace()
    namespace_list = [ns.metadata.name for ns in namespaces.items]

    for index, namespace in enumerate(namespace_list, start=1):
        print(f"{index}. {namespace}")

    while True:
        try:
            selection = int(input(f"\nWhich namespace? (Number): "))
            if 1 <= selection <= len(namespace_list):
                break
            else:
                logging.error(
                    "Invalid selection. Please enter a number corresponding to one of the listed namespaces."
                )
        except ValueError:
            logging.error("Invalid input. Please enter a valid number.")

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
        return None
    except client.ApiException as e:
        print(f"Error getting CRD '{name}': {e}")
        return None


def get_resources(resource_client, namespace):
    try:
        list_function, params = resource_client

        if isinstance(list_function, client.CustomObjectsApi):
            version = get_crd_version(group=params["group"], plural=params["plural"])

            resources = list_function.list_namespaced_custom_object(
                group=params["group"],
                plural=params["plural"],
                version=version,
                namespace=namespace,
            )
            return resources

        if "namespace" in inspect.signature(list_function).parameters:

            resources = list_function(namespace=namespace)
        else:
            resources = list_function()
        return resources.to_dict()

    except Exception as err:
        logging.error(f"Error getting object: {err}")
        return err
