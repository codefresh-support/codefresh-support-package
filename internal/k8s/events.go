package k8s

import (
	"bytes"
	"fmt"
	"os/exec"
)

func Events(namespace string) (string, error) {
	cmd := exec.Command("kubectl", "get", "events", "-n", namespace, "--sort-by=.metadata.creationTimestamp")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("error getting k8s events: %v: %s", err, stderr.String())
	}
	return out.String(), nil
}
