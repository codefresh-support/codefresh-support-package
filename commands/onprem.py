from models.onprem import OnPrem
from utils import files
import time
import argparse


def setup_parser(parser):
    parser.add_argument(
        "-n", "--namespace", help="The namespace where Codefresh On-Prem is installed"
    )


def execute(args):
    runtime_type = "onprem"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    runtime = OnPrem()
    runtime.set_creds()

    if runtime.base_url == "https://g.codefresh.io/api":
        print(
            "Cannot gather On-Prem data for Codefresh SaaS. If you need to gather data for Codefresh On-Prem, please update your ./cfconfig context (or Envs) to point to an On-Prem instance."
        )
        return

    if not args.namespace:
        print(f"Which namespace is Codefresh On-Prem installed in?")
        runtime.select_namespace()
    else:
        runtime.namespace = args.namespace

    print(f"Gathering data in the {runtime.namespace} namespace")
    k8s_resources = runtime.get_k8s_resources()
    files.save_k8s_resources(k8s_resources, dir_path)

    if runtime.base_url != None:
        accounts = runtime.get_accounts()
        files.save_file(files.to_yaml(accounts), "onprem_accounts.yaml", dir_path)

        runtimes = runtime.get_runtimes()
        files.save_file(files.to_yaml(runtimes), "onprem_runtimes.yaml", dir_path)

        total_users = runtime.get_total_users()
        files.save_file(total_users, "onprem_total_users.txt", dir_path)

        features = runtime.get_feature_flags()
        files.save_file(files.to_yaml(features), "onprem_features.yaml", dir_path)

    print("Gathering data completed")
    files.compress_dir(dir_path)


if __name__ == "__main__":
    # Example of how you might test the command directly
    parser = argparse.ArgumentParser(description=__doc__)
    setup_parser(parser)
    args = parser.parse_args()
    execute(args)
