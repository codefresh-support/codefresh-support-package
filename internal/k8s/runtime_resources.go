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
	"Products",
	"PromotionFlows",
	"PromotionPolicies",
	"PromotionTemplates",
	"RestrictedGitSources",
}

var K8sArgo = []string{
	"AnalysisRuns",
	"AnalysisTemplates",
	"Applications",
	"ApplicationSets",
	"AppProjects",
	"EventBus",
	"EventSources",
	"Experiments",
	"Rollouts",
	"Sensors",
}
