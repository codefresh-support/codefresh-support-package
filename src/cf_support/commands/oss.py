from ..models.oss import Oss
from ..utils import files
import time


def execute(namespace):
    runtime_type = "oss"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"
    runtime = Oss()

    if not namespace:
        print(f"Which namespace is the Open Source Argo installed in?")
        runtime.select_namespace()
    else:
        runtime.namespace = namespace

    print(f"Gathering data in the {runtime.namespace} namespace")
    k8s_resources = runtime.get_k8s_resources()

    files.save_k8s_resources(k8s_resources, dir_path)

    print("Gathering data complete")
    files.compress_dir(dir_path)
