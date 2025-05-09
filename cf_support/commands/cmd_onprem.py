from core import codefresh, k8s
from utils import files
import time


def execute(namespace):
    runtime_type = "onprem"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    cf_creds = codefresh.get_codefresh_creds()

    if cf_creds["base_url"] == "https://g.codefresh.io/api":
        print(
            "Cannot gather On-Prem data for Codefresh SaaS. If you need to gather data for Codefresh On-Prem, please update your ./cfconfig context (or Envs) to point to an On-Prem instance."
        )
        return

    if not namespace:
        print(f"Which namespace is Codefresh On-Prem installed in?")
        namespace = k8s.select_namespace()

    print(f"Gathering data in the {namespace} namespace")
    k8s_resources = k8s.get_k8s_resources(namespace)
    files.save_k8s_resources(k8s_resources, dir_path)

    if cf_creds["base_url"] != None:
        accounts = codefresh.get_system_accounts(cf_creds)
        files.save_file(files.to_yaml(accounts), "onprem_accounts.yaml", dir_path)

        runtimes = codefresh.get_system_runtimes(cf_creds)
        files.save_file(files.to_yaml(runtimes), "onprem_runtimes.yaml", dir_path)

        total_users = codefresh.get_system_total_users(cf_creds)
        files.save_file(total_users, "onprem_total_users.txt", dir_path)

        features = codefresh.get_system_feature_flags(cf_creds)
        files.save_file(files.to_yaml(features), "onprem_features.yaml", dir_path)

    print("Gathering data completed")
    files.compress_dir(dir_path)
