"""Functions exposed to the Node API. Add new ones here and decorate them with @expose.

Arguments and return values must be JSON-serialisable, because they cross the Node <-> Python
boundary as JSON.
"""

import os
from typing import Any

from . import __version__
from .registry import expose


@expose
def ping() -> dict[str, Any]:
    """Health check: proves the package is installed and callable."""
    return {"ok": True, "package": "pyd-100", "version": __version__}


@expose
def file_info(path: str) -> dict[str, Any]:
    """Basic facts about a file on disk (example of a function that takes arguments)."""
    exists = os.path.isfile(path)

    return {
        "path": path,
        "exists": exists,
        "size": os.path.getsize(path) if exists else None,
        "extension": os.path.splitext(path)[1].lower(),
    }
