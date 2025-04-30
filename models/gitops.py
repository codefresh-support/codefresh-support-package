from .oss import Oss


class Gitops(Oss):
    def __init__(self):
        super().__init__()

    def get_k8s_resources(self):
        base_resources = super().get_resources()
        additonal_resources = {
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
        }
        return {**base_resources, **additonal_resources}
