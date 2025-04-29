from .k8s import K8s


class Gitops(K8s):
    def __init__(self):
        super().__init__()

    def get_k8s_resources(self):
        return {
            "configmaps": self.core_v1.list_namespaced_config_map(
                namespace=self.namespace
            ).to_dict(),
            "daemonsets": self.apps_v1.list_namespaced_daemon_set(
                namespace=self.namespace
            ).to_dict(),
            "deployments": self.apps_v1.list_namespaced_deployment(
                namespace=self.namespace
            ).to_dict(),
            "jobs": self.batch_v1.list_namespaced_job(
                namespace=self.namespace
            ).to_dict(),
            "nodes": self.core_v1.list_node().to_dict(),
            "pods": self.core_v1.list_namespaced_pod(
                namespace=self.namespace
            ).to_dict(),
            "serviceaccounts": self.core_v1.list_namespaced_service_account(
                namespace=self.namespace
            ).to_dict(),
            "services": self.core_v1.list_namespaced_service(namespace=self.namespace),
            "statefulsets": self.apps_v1.list_namespaced_stateful_set(
                namespace=self.namespace
            ).to_dict(),
            "products.codefresh.io": self.crds.list_namespaced_custom_object(
                group="codefresh.io",
                plural="products",
                version=self.get_crd_version(group="codefresh.io", plural="products"),
                namespace=self.namespace,
            ),
            "promotionflows.codefresh.io": self.crds.list_namespaced_custom_object(
                group="codefresh.io",
                plural="promotionflows",
                version=self.get_crd_version(
                    group="codefresh.io", plural="promotionflows"
                ),
                namespace=self.namespace,
            ),
            "promotionpolicies.codefresh.io": self.crds.list_namespaced_custom_object(
                group="codefresh.io",
                plural="promotionpolicies",
                version=self.get_crd_version(
                    group="codefresh.io", plural="promotionpolicies"
                ),
                namespace=self.namespace,
            ),
            "promotiontemplates.codefresh.io": self.crds.list_namespaced_custom_object(
                group="codefresh.io",
                plural="promotiontemplates",
                version=self.get_crd_version(
                    group="codefresh.io", plural="promotiontemplates"
                ),
                namespace=self.namespace,
            ),
            "restrictedgitsources.codefresh.io": self.crds.list_namespaced_custom_object(
                group="codefresh.io",
                plural="restrictedgitsources",
                version=self.get_crd_version(
                    group="codefresh.io", plural="restrictedgitsources"
                ),
                namespace=self.namespace,
            ),
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
