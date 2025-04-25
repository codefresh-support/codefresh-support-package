"""
Prints the current version of the Codfresh Support Package tool
"""

# import argparse

__version__ = "0.0.0"


def setup_parser(parser):
    pass


def execute(args):
    print(__version__)


if __name__ == "__main__":
    # Example of how you might test the command directly
    # parser = argparse.ArgumentParser(description=__doc__)
    # setup_parser(parser)
    # args = parser.parse_args()
    # execute(args)
    execute(None)
