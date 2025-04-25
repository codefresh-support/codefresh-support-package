k8s_general = [
    "configmaps",
    "daemonsets.apps",
    "deployments.apps",
    "jobs.batch",
    "nodes",
    "pods",
    "serviceaccounts",
    "services",
    "statefulsets.apps",
]

k8s_classic = [
    "cronjobs.batch",
    "persistentvolumeclaims",
    "persistentvolumes",
    "storageclasses.storage.k8s.io",
]

k8s_gitops = [
    "products.codefresh.io",
    "promotionflows.codefresh.io",
    "promotionpolicies.codefresh.io",
    "promotiontemplates.codefresh.io",
    "restrictedgitsources.codefresh.io",
]

k8s_oss = [
    "analysisruns.argoproj.io",
    "analysistemplates.argoproj.io",
    "applications.argoproj.io",
    "applicationsets.argoproj.io",
    "appprojects.argoproj.io",
    "eventbus.argoproj.io",
    "eventsources.argoproj.io",
    "experiments.argoproj.io",
    "rollouts.argoproj.io",
    "sensors.argoproj.io",
]
