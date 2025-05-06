import requests
import logging


def make_request(base_url, api_key, endpoint):
    headers = {
        "Authorization": api_key,
    }

    response = requests.get(f"{base_url}{endpoint}", headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        logging.error(f"Error: {response.status_code} - {response.text}")
        return response.text
