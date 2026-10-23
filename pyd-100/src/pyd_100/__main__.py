"""Command-line entry used by the Node API:

    python -m pyd_100 list
    python -m pyd_100 call <function>      (keyword arguments as a JSON object on stdin)

Every invocation prints exactly one JSON document to stdout:
    {"ok": true,  "result": ...}
    {"ok": false, "error": "...", "type": "..."}
and exits 0 for a handled call, so Node always has a result to parse.
"""

import io
import json
import sys
import traceback

from . import available, call


def main(argv: list[str]) -> int:
    # Windows consoles default to a legacy code page; the Node side always decodes UTF-8.
    for stream in (sys.stdin, sys.stdout):
        if isinstance(stream, io.TextIOWrapper):
            stream.reconfigure(encoding="utf-8")

    try:
        if len(argv) >= 1 and argv[0] == "list":
            print(json.dumps({"ok": True, "result": available()}))
            return 0

        if len(argv) == 2 and argv[0] == "call":
            raw = sys.stdin.read().strip()
            kwargs = json.loads(raw) if raw else {}

            if not isinstance(kwargs, dict):
                raise TypeError("Arguments must be a JSON object of keyword arguments.")

            print(json.dumps({"ok": True, "result": call(argv[1], kwargs)}, default=str))
            return 0

        print(json.dumps({"ok": False, "error": "Usage: python -m pyd_100 (list | call <function>)", "type": "UsageError"}))
        return 2
    except Exception as error:  # noqa: BLE001 - everything must come back to Node as JSON
        print(json.dumps({
            "ok": False,
            "error": str(error),
            "type": type(error).__name__,
            "trace": traceback.format_exc(limit=5),
        }))
        return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
