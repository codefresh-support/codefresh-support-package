# Codefresh Support Package

This project is designed to gather data from Codefresh Hybrid Runtimes OnPrem isntallation, and Open Source ArgoCD. It collects information about various Kubernetes resources such as Pods, Nodes, Configmaps, Services, and Events. For Pipelines and OnPrem we gather some informtion from the platform itself.

## Prereqs

- `kubectl`
  - Current Context must be the context of the cluster where the Codefresh is installed.
- Codefresh
  - CLI installed and configured.
  - Or the following ENV vars set.
    - `CF_API_KEY`: Codefresh API Token
    - `CF_URL`: URL of the platform (ex: `https://g.codefresh.io`)
  - Need an Account Admin Token for Pipelines Hybrid Runtime.
  - Need a System Admin Token for the OnPrem Installation.
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

### macOS - amd64

```shell
# get the latest version or change to a specific version
VERSION=$(curl --silent "https://api.github.com/repos/codefresh-support/codefresh-support-package/releases/latest" | jq -r ".tag_name")

# download and extract the binary
curl -L --output - https://github.com/codefresh-support/codefresh-support-package/releases/download/$VERSION/cf-support_darwin_amd64.tar.gz | tar zx -O > cf-support

# set execution to binary
chmod +x cf-support

# run application
./cf-support
```

### linux - arm64

```shell
# get the latest version or change to a specific version
VERSION=$(curl --silent "https://api.github.com/repos/codefresh-support/codefresh-support-package/releases/latest" | jq -r ".tag_name")

# download and extract the binary
curl -L --output - https://github.com/codefresh-support/codefresh-support-package/releases/download/$VERSION/cf-support_linux_arm64.tar.gz | tar zx -O > cf-support

# set execution to binary
chmod +x cf-support

# run application
./cf-support
```

### linux - amd64

```shell
# get the latest version or change to a specific version
VERSION=$(curl --silent "https://api.github.com/repos/codefresh-support/codefresh-support-package/releases/latest" | jq -r ".tag_name")

# download and extract the binary
curl -L --output - https://github.com/codefresh-support/codefresh-support-package/releases/download/$VERSION/cf-support_linux_amd64.tar.gz | tar zx -O > cf-support

# set execution to binary
chmod +x cf-support

# run application
./cf-support
```

### Windows - arm64/amd6

1. Go the the [Latest](https://github.com/codefresh-support/codefresh-support-package/releases/latest) release.
1. Download the cf-support_windows_arm64.zip / cf-support_windows_amd64.zip file
1. Run the `.exe` file via CMD or PowerShell

## How to Release a New Version

1. Create a tag starting with `v`
1. Push tag to repo

```shell
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```
