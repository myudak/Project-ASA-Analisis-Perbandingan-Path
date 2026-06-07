"""Backward-compatible public API and CLI entry point."""

from .core import *  # noqa: F401,F403
from .suites import main


if __name__ == "__main__":
    main()
