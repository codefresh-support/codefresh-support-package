import logging
import os

LOG_DIR = "logs"
LOG_FILE = "cli.log"
os.makedirs(LOG_DIR, exist_ok=True)


def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if not logger.hasHandlers():
        formatter = logging.Formatter(
            "%(asctime)s - %(levelname)s - %(name)s.%(funcName)s() - %(message)s"
        )

        file_handler = logging.FileHandler(os.path.join(LOG_DIR, LOG_FILE))
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.DEBUG)

        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(formatter)
        stream_handler.setLevel(logging.INFO)

        logger.addHandler(file_handler)

    return logger
