package utils

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v2"
)

func WriteYaml(data interface{}, name, dirPath string) error {
	filePath := filepath.Join(dirPath, fmt.Sprintf("%s.yaml", name))
	fileContent, err := yaml.Marshal(data)
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, fileContent, 0644)
}
