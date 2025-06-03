from dataclasses import dataclass


@dataclass
class Event:
    creation_timestamp: str
    type: str
    reason: str
    name: str
    kind: str
    message: str
    source: str
    count: int
