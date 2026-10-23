"""Registry of the functions the Node API is allowed to call.

Only functions decorated with @expose can be reached from outside, so the Node side can never
run arbitrary Python by name.
"""

from typing import Any, Callable

_FUNCTIONS: dict[str, Callable[..., Any]] = {}


def expose(func: Callable[..., Any]) -> Callable[..., Any]:
    """Make a function callable from Node by its own name."""
    _FUNCTIONS[func.__name__] = func
    return func


def available() -> list[str]:
    return sorted(_FUNCTIONS)


def call(name: str, kwargs: dict[str, Any] | None = None) -> Any:
    if name not in _FUNCTIONS:
        raise LookupError(f"Unknown function '{name}'. Available: {', '.join(available()) or 'none'}")

    return _FUNCTIONS[name](**(kwargs or {}))
