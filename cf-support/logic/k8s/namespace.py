from kubernetes import client, config
import logging


def select_namespace():
    """
    Select a specific namespace from the current kubernetes cluster.
    """

    config.load_kube_config()
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
