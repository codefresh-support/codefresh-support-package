# Codefresh Support Package

This project is designed to gather data from Hybrid Runtimes for Codefresh SaaS platform and OnPrem Platforms. It collects information about various Kubernetes resources such as Pods, Nodes, Configmaps, Services, and Events. It also fetches logs for each Pod.

## Prereqs

- `kubectl config current-context` must be the context of the cluster where the Hybrid Runner is installed.
- Codefresh
  - CLI installed and configured
  - Or the following ENV vars set
    - `CF_API_KEY`: Codefresh API Token
    - `CF_URL`: URL of the platform (ex: `https://g.codefresh.io`)

## Usage

1. Download the [latest release](https://github.com/codefresh-support/codefresh-support-package/releases) of the tool for your platform.
1. Execute the file via the CLI and follow the prompts.
1. Redact any sensitive contents and upload the package to the support ticket.
