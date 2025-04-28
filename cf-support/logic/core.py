from utils import files
from . import k8s
from cmd.version import __version__
import logging


def gather_data(namespace, k8s_resources, dir_path):
    for type, resource_client in k8s_resources.items():
        resources = k8s.get_resources(resource_client, namespace)
        for item in resources["items"]:
            files.save_file(
                files.to_yaml(item),
                f"{item["metadata"]["name"]}.yaml",
                f"{dir_path}/{type}",
            )
