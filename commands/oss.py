from models.oss import Oss
from utils import files
import time
import argparse


def setup_parser(parser):
    parser.add_argument(
        "-n", "--namespace", help="The namespace where the ArgoCD is installed"
    )


def execute(args):
    runtime_type = "oss"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"
    runtime = Oss()

    if not args.namespace:
        print(f"Which namespace is the Open Source Argo installed in?")
        runtime.select_namespace()
    else:
        runtime.namespace = args.namespace

    print(f"Gathering data in the {runtime.namespace} namespace")
    k8s_resources = runtime.get_k8s_resources()

    files.save_k8s_resources(k8s_resources, dir_path)

    print("Gathering data complete")
    files.compress_dir(dir_path)


if __name__ == "__main__":
    # Example of how you might test the command directly
    parser = argparse.ArgumentParser(description=__doc__)
    setup_parser(parser)
    args = parser.parse_args()
    execute(args)
