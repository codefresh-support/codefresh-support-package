from importlib.metadata import version, PackageNotFoundError


def execute():
    try:
        # Dynamically fetch the version of the package
        package_version = version("cf-support")
    except PackageNotFoundError:
        package_version = "0.0.0"  # Fallback version if not installed
    print(package_version)
