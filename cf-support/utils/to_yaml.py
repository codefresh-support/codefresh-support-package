import yaml
import logging


def to_yaml(content):
    """
    Convert the content to YAML
    """

    try:
        yaml_str = yaml.dump(content, default_flow_style=False)
        return yaml_str
    except Exception as err:
        logging.error(f"Error converting to YAML: {err}")
        return err
