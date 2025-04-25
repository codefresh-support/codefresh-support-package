from logic.k8s import namespace
from utils import resource_list
from utils.prepare_package import prepare_package
from logic.data.gather import gather
import time
import logging


def gitops(args):
    runtime_type = "gitops"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    if not args.namespace:
        print(f"Which namespace is the {runtime_type} runtime installed in?")
        args.namespace = namespace.select_namespace()

    logging.info(f"Gathering data in the {args.namespace} namespace")

    k8s_resources = (
        resource_list.k8s_general + resource_list.k8s_gitops + resource_list.k8s_oss
    )

    gather(args.namespace, k8s_resources, dir_path)
    prepare_package(dir_path)

    logging.info("Gathering data complete")
