# Codefresh Support Package

This project is designed to gather data from Hybrid Runtimes for Codefresh SaaS platform, and Hybrid Runtimes and OnPrem isntallation on the OnPrem Platform. It
collects information about various Kubernetes resources such as Pods, Nodes, Configmaps, Services, and Events. For Classic and OnPrem we gather some informtion
from the platform itself.

## Prereqs

- `kubectl`
  - Current Context must be the context of the cluster where the Codefresh is installed.
- Codefresh
  - CLI installed and configured.
  - Or the following ENV vars set.
    - `CF_API_KEY`: Codefresh API Token
    - `CF_URL`: URL of the platform (ex: `https://g.codefresh.io`)
  - Need an Account Admin Token for Claasic Hybrid Runtime.
  - Need a System Admin Token for the OnPrem Installation.
- Helm
  - Version 3.
  - Used to get the helm release version of the installation.
- JQ
  - Used only to get the latest version of the binary for *nix systems.

## Usage

### macOS - arm64

```shell
# get the latest version or change to a specific version
VERSION=$(curl --silent "https://api.github.com/repos/codefresh-support/codefresh-support-package/releases/latest" | jq -r ".tag_name")

# download and extract the binary
curl -L --output - https://github.com/codefresh-support/codefresh-support-package/releases/download/$VERSION/cf-support_darwin_arm64.tar.gz | tar zx -O > cf-support

# set execution to binary
chmod +x cf-support

# run application
./cf-support
```

### macOS - x86_64

```shell
# get the latest version or change to a specific version
VERSION=$(curl --silent "https://api.github.com/repos/codefresh-support/codefresh-support-package/releases/latest" | jq -r ".tag_name")

# download and extract the binary
curl -L --output - https://github.com/codefresh-support/codefresh-support-package/releases/download/$VERSION/cf-support_darwin_x86_64.tar.gz | tar zx -O > cf-support

# set execution to binary
chmod +x cf-support

# run application
./cf-support
```

### linux - x86_64

```shell
# get the latest version or change to a specific version
VERSION=$(curl --silent "https://api.github.com/repos/codefresh-support/codefresh-support-package/releases/latest" | jq -r ".tag_name")

# download and extract the binary
curl -L --output - https://github.com/codefresh-support/codefresh-support-package/releases/download/$VERSION/cf-support_linux_x86_64.tar.gz | tar zx -O > cf-support

# set execution to binary
chmod +x cf-support

# run application
./cf-support
```

### Windows - x86_64

1. Go the the [Latest](https://github.com/codefresh-support/codefresh-support-package/releases/latest) release.
1. Download the cf-support_windows_x86_64.zip file
1. Run the `.exe` file via CMD or PowerShell

## Exit Codes

- 10 - Failed to get codefresh credentials. Please set the enviroment variables (CF_API_KEY and CF_BASE_URL) or make sure you have a valid codefresh config file.
- 20 - Failed to Create Demo Pipeline / Project or Failed to run Demo Pipeline.
- 30 - Failed to Delete Demo Pipeline / Project
