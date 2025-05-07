from ..models.pipeline import Pipeline
from ..utils import files
import time


def execute(namespace):
    runtime_type = "pipelines"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"
    runtime = Pipeline()
    runtime.set_creds()

    re_spec = runtime.get_runtime_spec()

    if not namespace:
        print(f"Which namespace is the {runtime_type} runtime installed in?")
        runtime.select_namespace()
    else:
        runtime.namespace = namespace

    print(f"Gathering data in {runtime.namespace} namespace")
    k8s_resources = runtime.get_k8s_resources()
    files.save_k8s_resources(k8s_resources, dir_path)

    files.save_file(files.to_yaml(re_spec), "pipelines-runtime-spec.yaml", dir_path)

    print("Data gathered successfully.")
    files.compress_dir(dir_path)
