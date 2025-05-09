from core import codefresh, k8s
from utils import files, version
import time


def execute(namespace):
    runtime_type = "pipelines"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    cf_creds = codefresh.get_codefresh_creds()
    re_spec = codefresh.get_runtime_spec(cf_creds)

    if not namespace:
        print(f"Which namespace is the {runtime_type} runtime installed in?")
        namespace = k8s.select_namespace()

    print(f"Gathering data in {namespace} namespace")
    k8s_resources = k8s.get_k8s_resources(namespace)
    files.save_k8s_resources(k8s_resources, dir_path)
    files.save_file(version.get_version(), "package_version.txt", dir_path)

    files.save_file(files.to_yaml(re_spec), "pipelines-runtime-spec.yaml", dir_path)

    print("Data gathered successfully.")
    files.compress_dir(dir_path)
