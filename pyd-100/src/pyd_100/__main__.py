"""Command-line entry used by the Node API:

    python -m pyd_100 list
    python -m pyd_100 call <function>      (keyword arguments as a JSON object on stdin)

Every invocation prints exactly one DTO-shaped JSON document to stdout, e.g.
    {"success": true,  "message": "...", "data": ..., "statusCode": 200}
    {"success": false, "message": "...", "data": null, "statusCode": 400, "extraData": {...}}
and exits 0, so Node always has a response to parse.
"""

import io
import json
import sys

from . import available, call
from .dto import BaseDto, ErrorDto, SuccessDto


def run(argv: list[str]) -> BaseDto:
    if len(argv) == 1 and argv[0] == "list":
        return SuccessDto(available(), "OK", 200)

    if len(argv) == 2 and argv[0] == "call":
        raw = sys.stdin.read().strip()

        try:
            kwargs = json.loads(raw) if raw else {}
        except json.JSONDecodeError as error:
            return ErrorDto(None, f"Arguments are not valid JSON: {error}", 400)

        if not isinstance(kwargs, dict):
            return ErrorDto(None, "Arguments must be a JSON object of keyword arguments.", 400)

        return call(argv[1], kwargs)

    return ErrorDto(None, "Usage: python -m pyd_100 (list | call <function>)", 400)


def main(argv: list[str]) -> int:
    # Windows consoles default to a legacy code page; the Node side always decodes UTF-8.
    for stream in (sys.stdin, sys.stdout):
        if isinstance(stream, io.TextIOWrapper):
            stream.reconfigure(encoding="utf-8")

    print(json.dumps(run(argv).to_dict(), default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
