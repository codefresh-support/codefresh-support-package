from dataclasses import dataclass
from typing import Dict, List, Optional


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


@dataclass
class PodLog:
    container_name: str
    log: str


@dataclass
class Pod:
    name: str
    namespace: str
    service_account: str
    node: str
    labels: Dict[str, str]
    annotations: Dict[str, str]
    creation_timestamp: str
    status: str
    ip: str
    node_selectors: Dict[str, str]
    tolerations: Dict[str, str]
    events: List[Event] 
    logs: List[PodLog]
    raw: Dict[str, str]


@dataclass
class Node:
    name: str
    labels: Dict[str, str]
    annotations: Dict[str, str]
    creation_timestamp: str
    ip: str
    hostname: str
    system_info: Dict[str, str]
    raw: Dict[str, str]
