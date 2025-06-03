from core import codefresh, k8s
from utils import files, version
import time


def execute(namespace, runtime_name):
    runtime_type = "pipelines"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"
    cf_creds = codefresh.get_codefresh_creds()

    if not namespace:
        print(f"Which namespace is the {runtime_type} runtime installed in?")
        namespace = k8s.select_namespace()

    print(f"Gathering data in {namespace} namespace")
    k8s_resources = k8s.get_k8s_resources(namespace)
    if cf_creds["cf_url"] != None:
        runtimes = codefresh.get_runtime_spec(cf_creds)
        if not runtime_name:
            re_spec = codefresh.select_runtime(runtimes)
        else:
            re_spec = codefresh.select_runtime(runtimes, runtime_name)
            
    print("Data gathered successfully.")

    print("Saving data")
    files.save_k8s_resources(k8s_resources, dir_path)
    files.save_file(version.get_version(), "package_version.txt", dir_path)
    if cf_creds["cf_url"] != None:
        files.save_file(files.to_yaml(re_spec), "pipelines-runtime-spec.yaml", dir_path)
    files.compress_dir(dir_path)
