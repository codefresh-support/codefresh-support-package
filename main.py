import argparse
from commands import gitops, onprem, oss, pipelines, version


def main():
    parser = argparse.ArgumentParser(
        prog="cf-support", description="Codefresh Support Package"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # gitops
    gitops_parser = subparsers.add_parser(
        "gitops", help="Collects Data for the GitOps Runtime"
    )
    gitops.setup_parser(gitops_parser)
    gitops_parser.set_defaults(func=gitops.execute)

    # pipelines
    pipelines_parser = subparsers.add_parser(
        "pipelines", help="Collects Data for the Pipelines Runtime"
    )
    pipelines.setup_parser(pipelines_parser)
    pipelines_parser.set_defaults(func=pipelines.execute)

    # onprem
    onprem_parser = subparsers.add_parser(
        "onprem", help="Collects Data for the Codefresh On-Prem"
    )
    onprem.setup_parser(onprem_parser)
    onprem_parser.set_defaults(func=onprem.execute)

    # oss
    oss_parser = subparsers.add_parser(
        "oss", help="Collects Data for the One Source Argo"
    )
    oss.setup_parser(oss_parser)
    oss_parser.set_defaults(func=oss.execute)

    # version
    version_parser = subparsers.add_parser(
        "version",
        help="Prints the current version of the Codfresh Support Package tool",
    )
    version.setup_parser(version_parser)
    version_parser.set_defaults(func=version.execute)

    args = parser.parse_args()

    if hasattr(args, "func"):
        args.func(args)
    elif args.command is None:
        parser.print_help()
    else:
        print(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()
