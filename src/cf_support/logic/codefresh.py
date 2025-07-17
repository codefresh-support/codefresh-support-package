import os
import yaml
import requests

def get_codefresh_credentials():
    env_token = os.getenv("CF_API_KEY")
    env_url = os.getenv("CF_URL")

    if env_token and env_url:
        return {
            "headers": {"Authorization": env_token},
            "base_url": f"{env_url}/api",
        }

    config_path = (
        f"{os.getenv('USERPROFILE')}/.cfconfig"
        if os.name == "nt"
        else f"{os.getenv('HOME')}/.cfconfig"
    )

    with open(config_path, "r") as config_file:
        config = yaml.safe_load(config_file)

    current_context = config["contexts"].get(config["current-context"])

    if not current_context:
        return None

    return {
        "headers": {"Authorization": current_context["token"]},
        "base_url": f"{current_context['url']}/api",
    }

def get_account_runtimes(cf_creds):
    response = requests.get(
        f"{cf_creds['base_url']}/runtime-environments",
        headers=cf_creds["headers"],
    )
    return response.json()

def get_runtime_spec(cf_creds, runtime):
    response = requests.get(
        f"{cf_creds['base_url']}/runtime-environments/{runtime}",
        headers=cf_creds["headers"],
    )
    return response.json()

def get_all_accounts(cf_creds):
    response = requests.get(
        f"{cf_creds['base_url']}/admin/accounts",
        headers=cf_creds["headers"],
    )
    return response.json()

def get_all_runtimes(cf_creds):
    response = requests.get(
        f"{cf_creds['base_url']}/admin/runtime-environments",
        headers=cf_creds["headers"],
    )
    return response.json()

def get_total_users(cf_creds):
    response = requests.get(
        f"{cf_creds['base_url']}/admin/user?limit=1&page=1",
        headers=cf_creds["headers"],
    )
    users = response.json()
    return {"totalUsers": users["total"]}

def get_system_feature_flags(cf_creds):
    response = requests.get(
        f"{cf_creds['base_url']}/admin/features",
        headers=cf_creds["headers"],
    )
    return response.json()