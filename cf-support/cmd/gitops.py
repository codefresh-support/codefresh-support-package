from logic import core
from logic.k8s import select_namespace
from utils import resource_list, files
import time
import argparse


def setup_parser(parser):
    parser.add_argument(
        "-n", "--namespace", help="The namespace where the gitops runtime is installed"
    )


def execute(args):

    runtime_type = "gitops"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    if not args.namespace:
        print(f"Which namespace is the {runtime_type} runtime installed in?")
        args.namespace = select_namespace()

    print(f"Gathering data in the {args.namespace} namespace")
    k8s_resources = {
        **resource_list.k8s_general,
        **resource_list.k8s_gitops,
        **resource_list.k8s_oss,
    }
    core.gather_data(args.namespace, k8s_resources, dir_path)
    print("Gathering data complete")
    files.compress_dir(dir_path)


if __name__ == "__main__":
    # Example of how you might test the command directly
    parser = argparse.ArgumentParser(description=__doc__)
    setup_parser(parser)
    args = parser.parse_args()
    execute(args)
