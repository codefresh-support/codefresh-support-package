from logic import codefresh, core
from logic.k8s import select_namespace
from utils import resource_list, files
import time
import logging
import argparse


def setup_parser(parser):
    parser.add_argument(
        "-n", "--namespace", help="The namespace where Codefresh On-Prem is installed"
    )


def execute(args):
    runtime_type = "onprem"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    cf_config = codefresh.get_creds()

    if cf_config.get("base_url") == "https://g.codefresh.io/api":
        logging.error(
            "Cannot gather On-Prem data for Codefresh SaaS. If you need to gather data for Codefresh On-Prem, please update your ./cfconfig context (or Envs) to point to an On-Prem instance."
        )
        return

    if not args.namespace:
        print(f"Which namespace is Codefresh On-Prem installed in?")
        args.namespace = select_namespace()

    logging.info(f"Gathering data in the {args.namespace} namespace")
    k8s_resources = resource_list.k8s_general + resource_list.k8s_classic
    core.gather_data(args.namespace, k8s_resources, dir_path)

    if cf_config.get("base_url") != None:
        accounts = codefresh.get_onprem_accounts(cf_config)
        files.save_file(files.to_yaml(accounts), "onprem_accounts.yaml", dir_path)

        runtimes = codefresh.get_onprem_runtimes(cf_config)
        files.save_file(files.to_yaml(runtimes), "onprem_runtimes.yaml", dir_path)

        total_users = codefresh.get_onprem_total_users(cf_config)
        files.save_file(total_users, "onprem_total_users.txt", dir_path)

        features = codefresh.get_onprem_feature_flags(cf_config)
        files.save_file(files.to_yaml(features), "onprem_features.yaml", dir_path)

    logging.info("Gathering data completed")
    files.compress_dir(dir_path)


if __name__ == "__main__":
    # Example of how you might test the command directly
    parser = argparse.ArgumentParser(description=__doc__)
    setup_parser(parser)
    args = parser.parse_args()
    execute(args)
