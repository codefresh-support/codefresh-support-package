from kubernetes import client, config

config.load_kube_config()

k8s_general = {
    "configmaps": (client.CoreV1Api().list_namespaced_config_map, None),
    "daemonsets": (client.AppsV1Api().list_namespaced_daemon_set, None),
    "deployments": (client.AppsV1Api().list_namespaced_deployment, None),
    "jobs": (client.BatchV1Api().list_namespaced_job, None),
    "nodes": (client.CoreV1Api().list_node, None),
    "pods": (client.CoreV1Api().list_namespaced_pod, None),
    "serviceaccounts": (client.CoreV1Api().list_namespaced_service_account, None),
    "services": (client.CoreV1Api().list_namespaced_service, None),
    "statefulsets": (client.AppsV1Api().list_namespaced_stateful_set, None),
}

k8s_classic = {
    "cronjobs": (client.BatchV1Api().list_namespaced_cron_job, None),
    "persistentvolumeclaims": (
        client.CoreV1Api().list_namespaced_persistent_volume_claim,
        None,
    ),
    "persistentvolumes": (client.CoreV1Api().list_persistent_volume, None),
    "storageclasses": (client.StorageV1Api().list_storage_class, None),
}

k8s_gitops = {
    "products.codefresh.io": (
        client.CustomObjectsApi(),
        {"group": "codefresh.io", "plural": "products"},
    ),
    "promotionflows.codefresh.io": (
        client.CustomObjectsApi(),
        {"group": "codefresh.io", "plural": "promotionflows"},
    ),
    "promotionpolicies.codefresh.io": (
        client.CustomObjectsApi(),
        {"group": "codefresh.io", "plural": "promotionpolicies"},
    ),
    "promotiontemplates.codefresh.io": (
        client.CustomObjectsApi(),
        {"group": "codefresh.io", "plural": "promotiontemplates"},
    ),
    "restrictedgitsources.codefresh.io": (
        client.CustomObjectsApi(),
        {
            "group": "codefresh.io",
            "plural": "restrictedgitsources",
        },
    ),
}

k8s_oss = {
    "analysisruns.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "analysisruns"},
    ),
    "analysistemplates.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "analysistemplates"},
    ),
    "applications.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "applications"},
    ),
    "applicationsets.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "applicationsets"},
    ),
    "appprojects.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "appprojects"},
    ),
    "eventbus.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "eventbus"},
    ),
    "eventsources.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "eventsources"},
    ),
    "experiments.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "experiments"},
    ),
    "rollouts.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "rollouts"},
    ),
    "sensors.argoproj.io": (
        client.CustomObjectsApi(),
        {"group": "argoproj.io", "plural": "sensors"},
    ),
}
