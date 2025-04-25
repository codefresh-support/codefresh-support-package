import os
import logging
import tarfile


def prepare_package(dir_path):
    """
    Compresses the support package into a compressed file. and then cleans up the temporary files.
    """

    # Compress the directory into a tar.gz file
    try:
        logging.info(f"Compressing data to {dir_path}.tar.gz")
        with tarfile.open(f"{dir_path}.tar.gz", "w:gz") as tar:
            tar.add(dir_path, arcname=os.path.basename(dir_path))
    except Exception as err:
        logging.error(f"Error compressing directory {dir_path}: {err}")

    # Clean up the original directory
    try:
        logging.info(f"Removing temp directory {dir_path}")
        os.rmdir(dir_path)
    except Exception as err:
        logging.error(f"Error removing directory {dir_path}: {err}")

    logging.info(f"Please attached {dir_path}.tar.gz to the support ticket.")
