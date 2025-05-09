from utils import network
import platform
import os
import yaml


def get_codefresh_creds():

    cf_api_key = os.getenv("CF_API_KEY")
    cf_url = os.getenv("CF_URL")

    if cf_api_key and cf_url:
        return {"cf_api_key": cf_api_key, "cf_url": f"{cf_url}/api"}

    if platform.system() == "Windows":
        config_path = os.path.join(os.getenv("USERPROFILE"), ".cfconfig")
    else:
        config_path = os.path.join(os.getenv("HOME"), ".cfconfig")

    try:
        with open(config_path, "r") as config_file:
            config = yaml.safe_load(config_file)
            current_context = config["contexts"][config["current-context"]]
            cf_api_key = current_context["token"]
            cf_url = current_context["url"]

            return {"cf_api_key": cf_api_key, "cf_url": f"{cf_url}/api"}

    except Exception as err:
        print(f"Error reading .cfconfig file: {err}")
        return {"cf_api_key": None, "cf_url": None}


def select_runtime(runtimes):
    if len(runtimes) != 0:
        for index, runtime in enumerate(runtimes, start=1):
            print(f"{index}. {runtime['metadata']['name']}")

        while True:
            try:
                selection = int(
                    input("\nPlease select the runtime to gather data from (Number): ")
                )
                if 1 <= selection <= len(runtimes):
                    break
                else:
                    print("Invalid selection. Please enter a valid number.")
            except ValueError:
                print("Invalid input. Please enter a valid number.")

        re_spec = runtimes[selection - 1]
        return re_spec
    else:
        return None


def get_runtime_spec(cf_creds):
    results = network.make_get_request(
        cf_creds["cf_url"],
        cf_creds["cf_api_key"],
        "/runtime-environments",
    )
    return results


def get_system_accounts(cf_creds):
    results = network.make_get_request(
        cf_creds["cf_url"],
        cf_creds["cf_api_key"],
        "/admin/accounts",
    )
    return results


def get_system_runtimes(cf_creds):
    results = network.make_get_request(
        cf_creds["cf_url"],
        cf_creds["cf_api_key"],
        "/admin/runtime-environments",
    )
    return results


def get_system_feature_flags(cf_creds):
    results = network.make_get_request(
        cf_creds["cf_url"],
        cf_creds["cf_api_key"],
        "/admin/features",
    )
    return results


def get_system_total_users(cf_creds):
    results = network.make_get_request(
        cf_creds["cf_url"],
        cf_creds["cf_api_key"],
        "/admin/user?limit=1&page=1",
    )
    return (results or {}).get("total", None)
