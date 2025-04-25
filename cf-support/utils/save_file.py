import os
import logging


def save_file(content, name, file_path):
    """
    Save a file to the specified path with the given name and content.
    """
    # Ensure the directory exists
    os.makedirs(file_path, exist_ok=True)

    # Construct the full file path
    full_path = os.path.join(file_path, name)

    # Write the content to the file
    try:
        with open(full_path, "w") as file:
            file.write(content)
    except Exception as err:
        logging.error(f"Error saving file {name}: {err}")
