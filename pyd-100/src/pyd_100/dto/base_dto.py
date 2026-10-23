from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class BaseDto:
    """Shared shape of the API's SuccessDto / ErrorDto (api/src/dto).

    Constructor argument order matches the TypeScript DTOs: data, message, status_code, extra_data.
    """

    data: Any
    message: str
    status_code: int
    extra_data: Any = None
    success: bool = True

    def to_dict(self) -> dict[str, Any]:
        """JSON-ready dict using the same camelCase keys as the API DTOs."""
        body: dict[str, Any] = {
            "success": self.success,
            "message": self.message,
            "data": self.data,
            "statusCode": self.status_code,
        }

        if self.extra_data is not None:
            body["extraData"] = self.extra_data

        return body
