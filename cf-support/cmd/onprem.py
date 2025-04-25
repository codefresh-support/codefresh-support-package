from logic.k8s import namespace
from logic.codefresh import codefresh_creds, codefresh_onprem
from utils import resource_list
from utils.prepare_package import prepare_package
from utils.to_yaml import to_yaml
from utils.save_file import save_file
from logic.data.gather import gather
import time
import logging


def onprem(args):
    runtime_type = "onprem"
    dir_path = f"cf-support-{runtime_type}-{int(time.time())}"

    cf_config = codefresh_creds.get_creds()

    if cf_config.get("base_url") == "https://g.codefresh.io/api":
        logging.error(
            "Cannot gather On-Prem data for Codefresh SaaS. If you need to gather data for Codefresh On-Prem, please update your ./cfconfig context (or Envs) to point to an On-Prem instance."
        )
        return

    if not args.namespace:
        print(f"Which namespace is Codefresh On-Prem installed in?")
        args.namespace = namespace.select_namespace()

    logging.info(f"Gathering data in the {args.namespace} namespace")

    k8s_resources = resource_list.k8s_general + resource_list.k8s_classic

    gather(args.namespace, k8s_resources, dir_path)

    if cf_config.get("base_url") != None:
        accounts = codefresh_onprem.get_accounts(cf_config)
        save_file(to_yaml(accounts), "onprem_accounts.yaml", dir_path)

        runtimes = codefresh_onprem.get_runtimes(cf_config)
        save_file(to_yaml(runtimes), "onprem_runtimes.yaml", dir_path)

        total_users = codefresh_onprem.get_users(cf_config)
        save_file(total_users, "onprem_total_users.txt", dir_path)

        features = codefresh_onprem.get_features(cf_config)
        save_file(to_yaml(features), "onprem_features.yaml", dir_path)

    prepare_package(dir_path)
    logging.info("Gathering data completed")
