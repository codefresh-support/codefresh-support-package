package k8s

import (
	"bytes"
	"fmt"
	"os/exec"

	"strings"
)

func SelectNamespace(runtimeType string) (string, error) {
	cmd := exec.Command("kubectl", "get", "namespaces", "-o", "jsonpath={.items[*].metadata.name}")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("unable to get namespaces: %v: %s", err, stderr.String())
	}

	namespaceList := strings.Split(out.String(), " ")
	for index, namespace := range namespaceList {
		fmt.Printf("%d. %s\n", index+1, namespace)
	}

	var selection int
	for {
		fmt.Printf("\nWhich namespace ss %s installed in? (Number): ", runtimeType)
		_, err := fmt.Scanf("%d", &selection)
		if err != nil || selection < 1 || selection > len(namespaceList) {
			fmt.Println("Invalid selection. Please enter a number corresponding to one of the listed namespaces.")
			continue
		}
		break
	}

	return namespaceList[selection-1], nil
}
