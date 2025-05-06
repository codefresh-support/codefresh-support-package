from models.gitops import Gitops
from utils import files
import time


def execute(namespace):

    runtime_type = "gitops"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"
    runtime = Gitops()

    if not namespace:
        print(f"Which namespace is the {runtime_type} runtime installed in?")
        runtime.select_namespace()
    else:
        runtime.namespace = namespace

    print(f"Gathering data in the {runtime.namespace} namespace")
    k8s_resources = runtime.get_k8s_resources()

    files.save_k8s_resources(k8s_resources, dir_path)

    print("Gathering data complete")
    files.compress_dir(dir_path)
