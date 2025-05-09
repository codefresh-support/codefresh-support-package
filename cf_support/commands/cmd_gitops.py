from core import k8s
from utils import files
import time


def execute(namespace):
    runtime_type = "gitops"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    if not namespace:
        print(f"Which namespace is the {runtime_type} runtime installed in?")
        namespace = k8s.select_namespace()

    print(f"Gathering data in the {namespace} namespace")
    k8s_resources = k8s.get_k8s_resources(namespace)

    files.save_k8s_resources(k8s_resources, dir_path)

    print("Gathering data complete")
    files.compress_dir(dir_path)
