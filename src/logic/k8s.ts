import { autoDetectClient } from '@cloudydeno/kubernetes-client';
import { AppsV1Api } from "@cloudydeno/kubernetes-apis/apps/v1";
import { ArgoprojIoV1alpha1Api } from "@cloudydeno/kubernetes-apis/argoproj.io/v1alpha1";
import { BatchV1Api } from "@cloudydeno/kubernetes-apis/batch/v1";
import { CoreV1Api } from '@cloudydeno/kubernetes-apis/core/v1';
import { StorageV1Api } from "@cloudydeno/kubernetes-apis/storage.k8s.io/v1";
import { ApiextensionsV1Api } from "@cloudydeno/kubernetes-apis/apiextensions.k8s.io/v1";


const kubeConfig = await autoDetectClient();
const appsApi = new AppsV1Api(kubeConfig);
const argoApi = new ArgoprojIoV1alpha1Api(kubeConfig);
const batchApi = new BatchV1Api(kubeConfig);
const coreApi = new CoreV1Api(kubeConfig);
const crdApi = new ApiextensionsV1Api(kubeConfig)
const storageApi = new StorageV1Api(kubeConfig);




async function getCrd(type: string, namespace: string) {
    try {
        const crd = await crdApi.getCustomResourceDefinition(type);
    
    const path = `/apis/${crd.spec.group}/${crd.spec.versions.find((v: any) => v.served)}/namespaces/${namespace}/${crd.spec.names.plural}`

    const response = await kubeConfig.performRequest({
        method: "GET",
        path: path,
        expectJson: true,
    })
    return response
    } catch (_error) {
        return null
    }
}

export function getResources(namespace: string) {
    const k8sResourceType = {
    'configmaps': () => coreApi.namespace(namespace).getConfigMapList(),
    'cronjobs.batch': () => batchApi.namespace(namespace).getCronJobList(),
    'daemonsets.apps': () => appsApi.namespace(namespace).getDaemonSetList(),
    'deployments.apps': () => appsApi.namespace(namespace).getDeploymentList(),
    'jobs.batch': () => batchApi.namespace(namespace).getJobList(),
    'nodes': () => coreApi.getNodeList(),
    'pods': () => coreApi.namespace(namespace).getPodList(),
    'serviceaccounts': () => coreApi.namespace(namespace).getServiceAccountList(),
    'services': () => coreApi.namespace(namespace).getServiceList(),
    'statefulsets.apps': () => appsApi.namespace(namespace).getStatefulSetList(),
    'persistentvolumeclaims': () => coreApi.namespace(namespace).getPersistentVolumeClaimList({ labelSelector: 'io.codefresh.accountName' }),
    'persistentvolumes': () => coreApi.getPersistentVolumeList({ labelSelector: 'io.codefresh.accountName' }),
    'storageclasses.storage.k8s.io': () => storageApi.getStorageClassList(),
    'products.codefresh.io': () => getCrd('products.codefresh.io', namespace),
    'promotionflows.codefresh.io': () => getCrd('products.codefresh.io', namespace),
    'promotionpolicies.codefresh.io': () => getCrd('promotionflows.codefresh.io', namespace),
    'promotiontemplates.codefresh.io': () => getCrd('promotiontemplates.codefresh.io', namespace),
    'restrictedgitsources.codefresh.io': () => getCrd('restrictedgitsources.codefresh.io', namespace),
    'analysisruns.argoproj.io': () => crdApi.getCustomResourceDefinitionList(),
    'analysistemplates.argoproj.io': () => getCrd('analysistemplates.argoproj.io', namespace),
    'applications.argoproj.io': () => argoApi.namespace(namespace).getApplicationList(),
    'applicationsets.argoproj.io': () => argoApi.namespace(namespace).getApplicationSetList(),
    'appprojects.argoproj.io': () => argoApi.namespace(namespace).getAppProjectList(),
    'eventbus.argoproj.io': () => getCrd('eventbus.argoproj.io', namespace),
    'eventsources.argoproj.io': () => getCrd('eventsources.argoproj.io', namespace),
    'experiments.argoproj.io': () => getCrd('experiments.argoproj.io', namespace),
    'rollouts.argoproj.io': () => getCrd('rollouts.argoproj.io', namespace),
    'sensors.argoproj.io': () => getCrd('sensors.argoproj.io', namespace),
    };

    return k8sResourceType

}
