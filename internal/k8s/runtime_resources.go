package k8s

var K8sGeneral = []string{
	"Configmaps",
	"DaemonSets",
	"Deployments",
	"Jobs",
	"Nodes",
	"Pods",
	"ServiceAccounts",
	"Services",
	"StatefulSets",
}

var K8sClassicOnPrem = []string{
	"CronJobs",
	"PersistentVolumeClaims",
	"PersistentVolumes",
	"Storageclass",
}

var K8sGitOps = []string{
	"products.codefresh.io",
	"promotionflows.codefresh.io",
	"promotionpolicies.codefresh.io",
	"promotiontemplates.codefresh.io",
	"restrictedgitsources.codefresh.io",
}

var K8sArgo = []string{
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
}
