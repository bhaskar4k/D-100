# pyd-100

Python package for D-100. It is built into a wheel and installed into the interpreter's
`site-packages`; the Node API (`api/src/util/PythonBridge.ts`) then calls its functions.

## Layout

```
pyd-100/
  pyproject.toml
  src/pyd_100/
    __init__.py     package + version
    registry.py     @expose decorator and the call() dispatcher
    functions.py    the functions Node can call  <-- add new ones here
    __main__.py     `python -m pyd_100 ...` entry used by Node
```

## Build and install

From this folder:

```bash
python -m pip install build
python -m build --wheel
python -m pip install --force-reinstall dist/pyd_100-*.whl
```

Re-run the last two commands after every change to the package (the installed copy in
`site-packages` is what Node runs, not the source folder).

Check the install:

```bash
python -m pyd_100 list
echo {} | python -m pyd_100 call ping
```

## Adding a function

```python
# src/pyd_100/functions.py
@expose
def my_function(path: str, limit: int = 10) -> dict:
    ...
    return {...}          # must be JSON-serialisable
```

Rebuild and reinstall, then call it from TypeScript:

```ts
import { CallPython } from "../util/PythonBridge";

const result = await CallPython<{ ... }>("my_function", { path, limit: 5 });
```

Only `@expose`d functions can be called, so Node can never run arbitrary Python by name.

## Native compilation

The wheel is plain Python (installed with byte-compiled `.pyc` files). Compiling to a native
extension (`.pyd`) needs Cython and a C compiler (MSVC Build Tools on Windows), neither of which
is set up on this machine yet.
