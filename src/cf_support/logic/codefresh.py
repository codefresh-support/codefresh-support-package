from dotenv import load_dotenv
import requests
import yaml
import sys
import os


load_dotenv()


# TODO: Add this when we break out the main function
# required_env_vars: list[str] = ["CF_API_KEY", "CF_URL"]

# for var in required_env_vars:
#     if not var:
#         sys.exit(f"Environment variable {var} is not defined")



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
