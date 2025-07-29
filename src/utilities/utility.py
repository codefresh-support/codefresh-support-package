from utilities.logger_config import setup_logger
import tarfile
import yaml
import os

logger = setup_logger(__name__)


class Utility:
    def __init__(self) -> None:
        pass

    def write_yaml_to_file(self, py_obj: object, filename: str):
        with open(f"{filename}.yaml", "w") as f:
            yaml.dump(py_obj, f, sort_keys=False)
        print("Written to file successfully")

    def create_tar_gz(self, output_filename: str, source_dir: str):
        if not os.path.isdir(source_dir):
            raise NotADirectoryError(f"{source_dir} is not a valid directory")

        with tarfile.open(output_filename, "w:gz") as tar:
            tar.add(source_dir, arcname=os.path.basename(source_dir))

    def prepare_package(self, dir_path: str):
        compressed_support_package = f"{dir_path}.tar.gz"

        logger.info(f"{self.__class__.__name__} Preparing the support package...")

    def process_dat(self):
        pass