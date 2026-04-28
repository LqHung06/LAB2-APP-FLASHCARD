from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    Status: str
    Code: int
    Message: str
    Data: Optional[T] = None

def success_response(data: Any = None, message: str = "Thành công", code: int = 200) -> StandardResponse:
    return StandardResponse(
        Status="success",
        Code=code,
        Message=message,
        Data=data
    )

def error_response(message: str, code: int = 400, data: Any = None) -> StandardResponse:
    return StandardResponse(
        Status="error",
        Code=code,
        Message=message,
        Data=data
    )
