from .k8s import K8s


class Oss(K8s):
    def __init__(self):
        super().__init__()

    def set_k8s_resources(self):
        base_resources = super().get_resources()
        additonal_resources = {
            "analysisruns.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="analysisruns",
                version=self.get_crd_version(
                    group="argoproj.io", plural="analysisruns"
                ),
                namespace=self.namespace,
            ),
            "analysistemplates.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="analysistemplates",
                version=self.get_crd_version(
                    group="argoproj.io", plural="analysistemplates"
                ),
                namespace=self.namespace,
            ),
            "applications.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="applications",
                version=self.get_crd_version(
                    group="argoproj.io", plural="applications"
                ),
                namespace=self.namespace,
            ),
            "applicationsets.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="applicationsets",
                version=self.get_crd_version(
                    group="argoproj.io", plural="applicationsets"
                ),
                namespace=self.namespace,
            ),
            "appprojects.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="appprojects",
                version=self.get_crd_version(group="argoproj.io", plural="appprojects"),
                namespace=self.namespace,
            ),
            "eventbus.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="eventbus",
                version=self.get_crd_version(group="argoproj.io", plural="eventbus"),
                namespace=self.namespace,
            ),
            "eventsources.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="eventsources",
                version=self.get_crd_version(
                    group="argoproj.io", plural="eventsources"
                ),
                namespace=self.namespace,
            ),
            "experiments.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="experiments",
                version=self.get_crd_version(group="argoproj.io", plural="experiments"),
                namespace=self.namespace,
            ),
            "rollouts.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="rollouts",
                version=self.get_crd_version(group="argoproj.io", plural="rollouts"),
                namespace=self.namespace,
            ),
            "sensors.argoproj.io": self.crds.list_namespaced_custom_object(
                group="argoproj.io",
                plural="sensors",
                version=self.get_crd_version(group="argoproj.io", plural="sensors"),
                namespace=self.namespace,
            ),
        }
        return {**base_resources, **additonal_resources}
