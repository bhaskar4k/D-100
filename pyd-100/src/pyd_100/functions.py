"""Functions exposed to the Node API. Add new ones here and decorate them with @expose.

Return a SuccessDto / ErrorDto (or any JSON-serialisable value, which is wrapped in a SuccessDto).
Arguments and return values cross the Node <-> Python boundary as JSON.
"""

import os

from . import __version__
from .dto import BaseDto, ErrorDto, SuccessDto
from .registry import expose


@expose
def ping() -> BaseDto:
    """Health check: proves the package is installed and callable."""
    return SuccessDto({"package": "pyd-100", "version": __version__}, "pong", 200)


@expose
def echo(text: str) -> BaseDto:
    """Returns the text unchanged (checks that Unicode survives the round trip)."""
    return SuccessDto({"text": text, "length": len(text)}, "Echoed.", 200)


@expose
def add(a: float, b: float) -> BaseDto:
    """Adds two numbers (checks that arguments and results cross the boundary)."""
    return SuccessDto({"a": a, "b": b, "sum": a + b}, "Added.", 200)


@expose
def divide(a: float, b: float) -> BaseDto:
    """Divides a by b; dividing by zero returns an ErrorDto (checks the handled-error path)."""
    if b == 0:
        return ErrorDto(None, "Cannot divide by zero.", 400, {"a": a, "b": b})

    return SuccessDto({"a": a, "b": b, "quotient": a / b}, "Divided.", 200)


@expose
def file_info(path: str) -> BaseDto:
    """Basic facts about a file on disk (example of a function that touches the file system)."""
    if not os.path.isfile(path):
        return ErrorDto(None, "File not found.", 404, {"path": path})

    return SuccessDto(
        {
            "path": path,
            "size": os.path.getsize(path),
            "extension": os.path.splitext(path)[1].lower(),
        },
        "File found.",
        200,
    )


@expose
def crash() -> BaseDto:
    """Always raises (checks the unhandled-exception path; remove once the bridge is verified)."""
    raise RuntimeError("Deliberate failure from pyd_100.crash()")
