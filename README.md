# Codefresh Support Package

This project is designed to gather data from Hybrid Runtimes for Codefresh SaaS platform, and Hybrid Runtimes and OnPrem isntallation on the OnPrem Platform. It collects information about various Kubernetes resources such as Pods, Nodes, Configmaps, Services, and Events.  For Classic and OnPrem we gather some informtion from the platform itself.

## Prereqs

- `kubectl`
  - Current Context must be the context of the cluster where the Codefresh is installed.
- Codefresh
  - CLI installed and configured
  - Or the following ENV vars set
    - `CF_API_KEY`: Codefresh API Token
    - `CF_URL`: URL of the platform (ex: `https://g.codefresh.io`)
  - Need an Account Admin Token for Claasic Hybrid Runtime
  - Need a System Admin Token for the OnPrem Installation.
- Helm
  - Version 3
  - Used to get the helm release version of the installation

## Usage

1. Download the [latest release](https://github.com/codefresh-support/codefresh-support-package/releases) of the tool for your platform.
1. Execute the file via the CLI and follow the prompts.
1. Redact any sensitive contents and upload the package to the support ticket.
