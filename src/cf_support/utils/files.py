import os
import yaml
import tarfile
import shutil


def save_file(content, name, file_path):
    os.makedirs(file_path, exist_ok=True)

    full_path = os.path.join(file_path, name)

    try:
        with open(full_path, "w") as file:
            file.write(content)
    except Exception as err:
        print(f"Error saving file {name}: {err}")


def to_yaml(content):
    try:
        yaml_str = yaml.dump(content, default_flow_style=False)
        return yaml_str
    except Exception as err:
        print(f"Error converting to YAML: {err}")
        return err


def compress_dir(dir_path):
    try:
        print(f"Compressing data to {dir_path}.tar.gz")
        with tarfile.open(f"{dir_path}.tar.gz", "w:gz") as tar:
            tar.add(dir_path, arcname=os.path.basename(dir_path))
    except Exception as err:
        print(f"Error compressing directory {dir_path}: {err}")

    try:
        print(f"Removing temp directory {dir_path}")
        shutil.rmtree(dir_path)
    except Exception as err:
        print(f"Error removing directory {dir_path}: {err}")

    print(f"Please attached {dir_path}.tar.gz to the support ticket.")


def save_k8s_resources(k8s_resources, dir_path):

    for type, data in k8s_resources.items():
        for item in data:
            item["metadata"].pop("managedFields", None)
            item["metadata"].pop("managed_fields", None)
            try:
                save_file(
                    to_yaml(item),
                    f"{item["metadata"]["name"]}.yaml",
                    f"{dir_path}/{type}",
                )
            except Exception as err:
                save_file(
                    err,
                    f"{item["metadata"]["name"]}.yaml",
                    f"{dir_path}/{type}",
                )
