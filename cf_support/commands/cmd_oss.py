from core import k8s
from utils import files, version
import time


def execute(namespace):
    runtime_type = "oss"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    if not namespace:
        print(f"Which namespace is the Open Source Argo installed in?")
        namespace = k8s.select_namespace()

    print(f"Gathering data in the {namespace} namespace")
    k8s_resources = k8s.get_k8s_resources(namespace)
    print("Gathering data complete")

    print("Saving data")
    files.save_k8s_resources(k8s_resources, dir_path)
    files.save_file(version.get_version(), "package_version.txt", dir_path)
    files.compress_dir(dir_path)
