from dotenv import load_dotenv
import os

from .controllers.auth_controller import AuthController

load_dotenv()

def main():
    env_token = os.getenv("CF_API_KEY")
    env_url = os.getenv("CF_URL")
    auth_controller = AuthController(env_token, env_url)

if __name__ == "__main__":
    main()