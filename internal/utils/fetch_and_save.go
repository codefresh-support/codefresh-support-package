package utils

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/codefresh-support/codefresh-support-package/internal/k8s"
)

func extractKind(crdName string) string {
	parts := strings.Split(crdName, ".")
	if len(parts) < 2 {
		return crdName
	}

	kind := parts[0]
	return kind
}

func FetchAndSaveData(namespace string, k8sResources []string, dirPath, version string) error {
	for _, k8sType := range k8sResources {
		kind := extractKind(k8sType)
		kindDir := filepath.Join(dirPath, kind)
		err := os.MkdirAll(kindDir, os.ModePerm)
		if err != nil {
			return fmt.Errorf("error creating directory: %v", err)
		}

		fmt.Printf("Gathering %s data...\n", k8sType)

		labelSelector := ""
		if k8sType == "PersistentVolumeClaims" || k8sType == "PersistentVolumes" {
			labelSelector = "io.codefresh.accountName"
		}

		k8sResources, err := k8s.Get(k8sType, namespace, labelSelector)
		if err != nil {
			fmt.Printf("Error getting %s resources: error: the server doesn't have a resource type \"%s\"\n", k8sType, strings.ToLower(k8sType))
			continue
		}

		err = os.WriteFile(filepath.Join(kindDir, fmt.Sprintf("_%sList.txt", kind)), []byte(k8sResources.List), os.ModePerm)
		if err != nil {
			return fmt.Errorf("error writing resource list: %v", err)
		}

		if k8sType == "PersistentVolumeClaims" || k8sType == "PersistentVolumes" {
			items, ok := k8sResources.JSON["items"].([]interface{})
			if ok && len(items) != 0 {
				// Convert items to []map[string]interface{}
				convertedItems := make([]map[string]interface{}, len(items))
				for i, item := range items {
					if itemMap, ok := item.(map[string]interface{}); ok {
						convertedItems[i] = itemMap
					} else {
						return fmt.Errorf("error converting item to map[string]interface{}")
					}
				}

				err = WriteApiCalls(convertedItems, k8sType, dirPath)
				if err != nil {
					return fmt.Errorf("error writing API calls: %v", err)
				}
			}
			continue
		}

		if k8sType == "Pods" {
			for _, resource := range k8sResources.JSON["items"].([]interface{}) {
				resourceMap := resource.(map[string]interface{})
				podName := resourceMap["metadata"].(map[string]interface{})["name"].(string)
				containers := resourceMap["spec"].(map[string]interface{})["containers"].([]interface{})

				for _, container := range containers {
					containerMap := container.(map[string]interface{})
					log, err := k8s.Logs(namespace, podName, containerMap["name"].(string))
					if err != nil {
						fmt.Println(err)
						continue
					}

					logFileName := filepath.Join(kindDir, fmt.Sprintf("%s_%s.log", podName, containerMap["name"].(string)))
					err = os.WriteFile(logFileName, []byte(log), os.ModePerm)
					if err != nil {
						return fmt.Errorf("error writing log file: %v", err)
					}
				}
			}
		}

		for _, resource := range k8sResources.JSON["items"].([]interface{}) {
			resourceMap := resource.(map[string]interface{})
			resourceName := resourceMap["metadata"].(map[string]interface{})["name"].(string)
			describeOutput, err := k8s.Describe(k8sType, namespace, resourceName)
			if err != nil {
				fmt.Println(err)
				continue
			}

			describeFileName := filepath.Join(kindDir, fmt.Sprintf("%s.yaml", resourceName))
			err = os.WriteFile(describeFileName, []byte(describeOutput), os.ModePerm)
			if err != nil {
				return fmt.Errorf("error writing describe file: %v", err)
			}
		}
	}

	events, err := k8s.Events(namespace)
	if err != nil {
		return fmt.Errorf("error getting k8s events: %v", err)
	}
	err = os.WriteFile(filepath.Join(dirPath, "Events.txt"), []byte(events), os.ModePerm)
	if err != nil {
		return fmt.Errorf("error writing events file: %v", err)
	}

	err = os.WriteFile(filepath.Join(dirPath, "cf-support-version.txt"), []byte(version), os.ModePerm)
	if err != nil {
		return fmt.Errorf("error writing version file: %v", err)
	}

	return nil
}
