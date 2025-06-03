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


def save_pod_logs(logs, file_path):
    for container, log in logs.items():
        save_file(log, f"{container}.log", file_path)


def to_yaml(content):
    try:
        yaml_str = yaml.dump(content, sort_keys=False, default_flow_style=False)
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
    for k8s_type, data in k8s_resources.items():
        if data:
            if k8s_type == "pods":
                for pods in data:
                    save_pod_logs(
                        pods["logs"],
                        f"{dir_path}/{k8s_type}/{pods["pod"]["metadata"]["name"]}",
                    )

                    save_file(
                        to_yaml(pods["pod"]),
                        f"{pods["pod"]["metadata"]["name"]}.yaml",
                        f"{dir_path}/{k8s_type}/{pods["pod"]["metadata"]["name"]}",
                    )
                    save_file(
                        pods["events"],
                        "events.log",
                        f"{dir_path}/{k8s_type}/{pods["pod"]["metadata"]["name"]}",
                    )

                continue

            if k8s_type == "events.events.k8s.io":
                event_messages = "\n".join(
                    f"{event.metadata.creation_timestamp}\t{event.type}\t{event.reason}\t{event.involved_object.kind}/{event.involved_object.name}\t{event.message}"
                    for event in data
                )
                event_messages = (
                    "Timestamp\tType\tReason\tObject\tMessage\n" + event_messages
                )

                save_file(event_messages, "events.log", dir_path)

                continue

            for item in data:
                save_file(
                    to_yaml(item),
                    f"{item["metadata"]["name"]}.yaml",
                    f"{dir_path}/{k8s_type}",
                )
