package utils

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v2"
)

func WriteApiCalls(resources []map[string]interface{}, k8sType, dirPath string) error {
	for _, item := range resources {
		filePath := filepath.Join(dirPath, k8sType, fmt.Sprintf("%s.yaml", item["metadata"].(map[string]interface{})["name"]))
		fileContent, err := yaml.Marshal(item)
		if err != nil {
			return fmt.Errorf("error marshaling %s resource: %v", k8sType, err)
		}
		err = os.WriteFile(filePath, fileContent, 0644)
		if err != nil {
			return fmt.Errorf("error writing %s resource to file: %v", k8sType, err)
		}
	}
	return nil
}
