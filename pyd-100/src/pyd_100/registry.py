"""Registry of the functions the Node API is allowed to call.

Only functions decorated with @expose can be reached from outside, so the Node side can never
run arbitrary Python by name.

call() always returns a DTO: functions may return a SuccessDto/ErrorDto themselves, or any
JSON-serialisable value (wrapped in a SuccessDto). Problems raised by the call itself are turned
into an ErrorDto, so Node always receives the same response shape as the API's own endpoints.
"""

import inspect
import traceback
from typing import Any, Callable

from .dto import BaseDto, ErrorDto, SuccessDto

_FUNCTIONS: dict[str, Callable[..., Any]] = {}


def expose(func: Callable[..., Any]) -> Callable[..., Any]:
    """Make a function callable from Node by its own name."""
    _FUNCTIONS[func.__name__] = func
    return func


def available() -> list[str]:
    return sorted(_FUNCTIONS)


def call(name: str, kwargs: dict[str, Any] | None = None) -> BaseDto:
    func = _FUNCTIONS.get(name)

    if func is None:
        return ErrorDto(None, f"Unknown function '{name}'. Available: {', '.join(available()) or 'none'}", 404)

    arguments = kwargs or {}

    try:
        inspect.signature(func).bind(**arguments)
    except TypeError as error:
        return ErrorDto(None, f"Invalid arguments for '{name}': {error}", 400)

    try:
        result = func(**arguments)
    except Exception as error:  # noqa: BLE001 - every failure must come back to Node as an ErrorDto
        return ErrorDto(
            None,
            str(error) or type(error).__name__,
            500,
            {"type": type(error).__name__, "trace": traceback.format_exc(limit=5)},
        )

    return result if isinstance(result, BaseDto) else SuccessDto(result, "OK", 200)
