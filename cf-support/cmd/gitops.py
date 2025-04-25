from logic import core
from logic.k8s import select_namespace
from utils import resource_list, files
import time
import logging


def gitops(args):
    runtime_type = "gitops"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    if not args.namespace:
        print(f"Which namespace is the {runtime_type} runtime installed in?")
        args.namespace = select_namespace()

    logging.info(f"Gathering data in the {args.namespace} namespace")

    k8s_resources = (
        resource_list.k8s_general + resource_list.k8s_gitops + resource_list.k8s_oss
    )

    core.gather_data(args.namespace, k8s_resources, dir_path)

    files.compress_dir(dir_path)

    logging.info("Gathering data complete")
