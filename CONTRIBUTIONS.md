# Contributing to Our Project

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Fixing a bug
- Proposing new features
- Correct misspellings
- etc.

## We Use [Github Flow](https://docs.github.com/en/get-started/quickstart/github-flow), So All Code Changes Happen Through Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Development

- We utilize Dev Containers for development and VS Code as our IDE.
  - VSCode extension is `ms-vscode-remote.remote-containers`.
  - Docker needs to be installed to run the containers.
  - If extensions are stuck on installing utilize `ctrl + shift + p` and utilize `Developer: Reload Window` command.
- 2 spaces for indentation rather than tabs.
- You can try running `deno lint` && `deno fmt` for style unification.
  - suggest running this command under `/src`.
- Update [VERSIONS](./VERSION) file when you need a new release version.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
