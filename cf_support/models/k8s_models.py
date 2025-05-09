from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class Event:
    name: str
    namespace: str
    reason: str
    message: str
    timestamp: str


@dataclass
class PodLog:
    container_name: str
    log: str


@dataclass
class Pod:
    name: str
    namespace: str
    service_account: str
    labels: Dict[str, str]
    annotations: Dict[str, str]
    status: str
    ip: str
    node_selectors: Dict[str, str]
    tolerations: Dict[str, str]
    events: List[Event] = field(default_factory=list)
    logs: List[PodLog] = field(default_factory=list)


@dataclass
class ConfigMap:
    name: str
    namespace: str
    labels: Dict[str, str]
    annotations: Dict[str, str]
    data: Dict[str, str]
    binary_data: Optional[Dict[str, str]] = None
