package k8s

import (
	"bytes"
	"fmt"
	"os/exec"
)

func Describe(k8sType, namespace, resourceName string) (string, error) {
	cmd := exec.Command("kubectl", "describe", k8sType, "-n", namespace, resourceName)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("error describing %s resource: %v: %s", k8sType, err, stderr.String())
	}
	return out.String(), nil
}
