from models.pipeline import Pipeline
from utils import files
import time
import argparse


def setup_parser(parser):
    parser.add_argument(
        "-n",
        "--namespace",
        help="The namespace where the pielines runtime is installed",
    )


def execute(args):
    runtime_type = "pipelines"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"
    runtime = Pipeline()
    runtime.set_creds()

    re_spec = runtime.get_runtime_spec()

    if not args.namespace:
        print(f"Which namespace is the {runtime_type} runtime installed in?")
        runtime.select_namespace()
    else:
        runtime.namespace = args.namespace

    print(f"Gathering data in {runtime.namespace} namespace")
    k8s_resources = runtime.get_k8s_resources()
    files.save_k8s_resources(k8s_resources, dir_path)

    files.save_file(files.to_yaml(re_spec), "pipelines-runtime-spec.yaml", dir_path)

    print("Data gathered successfully.")
    files.compress_dir(dir_path)


if __name__ == "__main__":
    # Example of how you might test the command directly
    parser = argparse.ArgumentParser(description=__doc__)
    setup_parser(parser)
    args = parser.parse_args()
    execute(args)
