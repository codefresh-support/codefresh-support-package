import os
import logging
import yaml
import tarfile


def save_file(content, name, file_path):
    os.makedirs(file_path, exist_ok=True)

    full_path = os.path.join(file_path, name)

    try:
        with open(full_path, "w") as file:
            file.write(content)
    except Exception as err:
        logging.error(f"Error saving file {name}: {err}")


def to_yaml(content):
    try:
        yaml_str = yaml.dump(content, default_flow_style=False)
        return yaml_str
    except Exception as err:
        logging.error(f"Error converting to YAML: {err}")
        return err


def compress_dir(dir_path):
    try:
        logging.info(f"Compressing data to {dir_path}.tar.gz")
        with tarfile.open(f"{dir_path}.tar.gz", "w:gz") as tar:
            tar.add(dir_path, arcname=os.path.basename(dir_path))
    except Exception as err:
        logging.error(f"Error compressing directory {dir_path}: {err}")

    try:
        logging.info(f"Removing temp directory {dir_path}")
        os.rmdir(dir_path)
    except Exception as err:
        logging.error(f"Error removing directory {dir_path}: {err}")

    logging.info(f"Please attached {dir_path}.tar.gz to the support ticket.")
