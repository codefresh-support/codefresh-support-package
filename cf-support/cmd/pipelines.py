from logic import codefresh, core
from logic.k8s import select_namespace
from utils import resource_list, files
import time

# import argparse


def setup_parser(parser):
    pass


def execute(args):
    runtime_type = "pipelines"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"
    cf_config = codefresh.get_creds()
    runtimes = codefresh.get_saas_runtimes(cf_config)

    if len(runtimes) != 0:
        for index, runtime in enumerate(runtimes, start=1):
            print(f"{index}. {runtime['metadata']['name']}")

        while True:
            try:
                selection = int(
                    input("\nPlease select the runtime to gather data from (Number): ")
                )
                if 1 <= selection <= len(runtimes):
                    break
                else:
                    print("Invalid selection. Please enter a valid number.")
            except ValueError:
                print("Invalid input. Please enter a valid number.")

        re_spec = runtimes[selection - 1]
        pipelines_namespace = re_spec["runtimeScheduler"]["cluster"]["namespace"]
    else:
        print("No runtimes found in the Codefresh account.")
        pipelines_namespace = select_namespace(runtime_type)

    print(f"Gathering data in {pipelines_namespace} namespace")
    k8s_resources = {**resource_list.k8s_general, **resource_list.k8s_classic}
    core.gather_data(pipelines_namespace, k8s_resources, dir_path)

    if re_spec:
        files.save_file(files.to_yaml(re_spec), "pipelines-runtime-spec.yaml", dir_path)

    print("Data gathered successfully.")
    files.compress_dir(dir_path)


if __name__ == "__main__":
    # Example of how you might test the command directly
    # parser = argparse.ArgumentParser(description=__doc__)
    # setup_parser(parser)
    # args = parser.parse_args()
    # execute(args)
    execute(None)
