from dataclasses import dataclass
from typing import Any

from .base_dto import BaseDto


@dataclass(frozen=True)
class ErrorDto(BaseDto):
    success: bool = False

    def __init__(self, data: Any, message: str, status_code: int, extra_data: Any = None) -> None:
        super().__init__(data=data, message=message, status_code=status_code, extra_data=extra_data, success=False)
