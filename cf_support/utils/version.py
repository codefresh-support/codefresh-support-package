from importlib.metadata import version, PackageNotFoundError


def get_version():
    try:
        # Dynamically fetch the version of the package
        package_version = version("cf-support")
    except PackageNotFoundError:
        package_version = "0.0.0"  # Fallback version if not installed
    return package_version
