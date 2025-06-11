package k8s

import (
	"bytes"
	"fmt"
	"os/exec"
)

func Logs(namespace, podName, containerName string) (string, error) {
	cmd := exec.Command("kubectl", "logs", "-n", namespace, podName, "-c", containerName, "--timestamps=true")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("error geting logs for %s - %s: %v: %s", podName, containerName, err, stderr.String())
	}
	return out.String(), nil
}
