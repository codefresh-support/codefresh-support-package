from dataclasses import dataclass, field
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


@dataclass
class Node:
    name: str
    labels: Dict[str, str]
    annotations: Dict[str, str]
    creation_timestamp: str
    ip: str
    hostname: str
    system_info: Dict[str, str]


@dataclass
class StorageClass:
    name: str
    parameters: Dict[str, str]
    provisioner: str
    reclaim_policy: str
    volume_binding_mode: str
