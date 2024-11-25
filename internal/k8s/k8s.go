package k8s

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
)

func GetK8sNamespace() (string, error) {
	cmd := exec.Command("kubectl", "get", "namespaces", "-o", "jsonpath={.items[*].metadata.name}")
	var out bytes.Buffer
	cmd.Stdout = &out
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("unable to get namespaces: %v", stderr.String())
	}

	namespaceList := strings.Fields(out.String())
	for index, namespace := range namespaceList {
		fmt.Printf("%d. %s\n", index+1, namespace)
	}

	var selection int
	for {
		fmt.Print("\nWhich Namespace Is Codefresh Installed In? (Number): ")
		_, err := fmt.Scanf("%d", &selection)
		if err != nil || selection < 1 || selection > len(namespaceList) {
			fmt.Println("Invalid selection. Please enter a number corresponding to one of the listed namespaces.")
			continue
		}
		break
	}

	return namespaceList[selection-1], nil
}

func GetK8sResources(k8sType, namespace, labelSelector string) (map[string]interface{}, string, error) {
	cmdList := exec.Command("kubectl", "get", strings.ToLower(k8sType), "-n", namespace, "-l", labelSelector)
	cmdJSON := exec.Command("kubectl", "get", strings.ToLower(k8sType), "-n", namespace, "-l", labelSelector, "-o", "json")

	var outList, outJSON bytes.Buffer
	cmdList.Stdout = &outList
	cmdList.Stderr = &outList
	cmdJSON.Stdout = &outJSON
	cmdJSON.Stderr = &outJSON

	if err := cmdList.Run(); err != nil {
		return nil, "", fmt.Errorf("error getting %s resources: %v", k8sType, err)
	}
	if err := cmdJSON.Run(); err != nil {
		return nil, "", fmt.Errorf("error getting %s resources: %v", k8sType, err)
	}

	var resourceJSON map[string]interface{}
	if err := json.Unmarshal(outJSON.Bytes(), &resourceJSON); err != nil {
		return nil, "", fmt.Errorf("error parsing JSON: %v", err)
	}

	return resourceJSON, outList.String(), nil
}

func GetK8sEvents(namespace string) (string, error) {
	cmd := exec.Command("kubectl", "get", "events", "-n", namespace, "--sort-by=.metadata.creationTimestamp")
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("error getting k8s events: %v", err)
	}

	return out.String(), nil
}

func DescribeK8sResources(k8sType, namespace, resourceName string) (string, error) {
	cmd := exec.Command("kubectl", "describe", strings.ToLower(k8sType), "-n", namespace, resourceName)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("error describing %s resource: %v", k8sType, err)
	}

	return out.String(), nil
}

func GetK8sLogs(namespace, podName, containerName string) (string, error) {
	cmd := exec.Command("kubectl", "logs", "-n", namespace, podName, "-c", containerName)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("error getting logs for %s - %s: %v", podName, containerName, err)
	}

	return out.String(), nil
}
