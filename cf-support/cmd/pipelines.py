from logic.k8s import namespace
from logic.codefresh import codefresh_creds, codefresh_saas
from utils import resource_list
from utils.prepare_package import prepare_package
from utils.to_yaml import to_yaml
from utils.save_file import save_file
from logic.data.gather import gather
import time
import logging


def pipelines(args):
    runtime_type = "pipelines"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    cf_config = codefresh_creds.get_creds()
    runtimes = codefresh_saas.get_runtimes(cf_config)

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
                    logging.error("Invalid selection. Please enter a valid number.")
            except ValueError:
                logging.error("Invalid input. Please enter a valid number.")

        re_spec = runtimes[selection - 1]
        pipelines_namespace = re_spec["runtimeScheduler"]["cluster"]["namespace"]
    else:
        print("No runtimes found in the Codefresh account.")
        pipelines_namespace = namespace.select_namespace(runtime_type)

    logging.info(f"Gathering data in {pipelines_namespace} namespace")

    k8s_resources = resource_list.k8s_general + resource_list.k8s_classic
    gather(pipelines_namespace, k8s_resources, dir_path)

    if re_spec:
        save_file(to_yaml(re_spec), "pipelines-runtime-spec.yaml", dir_path)

    prepare_package(dir_path)

    logging.info("Data gathered successfully.")
