package k8s

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
)

type K8sResources struct {
	List string
	JSON map[string]interface{}
}

func Get(k8sType, namespace, labelSelector string) (*K8sResources, error) {
	cmdList := exec.Command("kubectl", "get", strings.ToLower(k8sType), "-n", namespace, "-l", labelSelector)
	var outList bytes.Buffer
	var stderrList bytes.Buffer
	cmdList.Stdout = &outList
	cmdList.Stderr = &stderrList
	err := cmdList.Run()
	if err != nil {
		return nil, fmt.Errorf("error getting %s resources: %v: %s", k8sType, err, stderrList.String())
	}

	cmdJSON := exec.Command("kubectl", "get", strings.ToLower(k8sType), "-n", namespace, "-l", labelSelector, "-o", "json")
	var outJSON bytes.Buffer
	var stderrJSON bytes.Buffer
	cmdJSON.Stdout = &outJSON
	cmdJSON.Stderr = &stderrJSON
	err = cmdJSON.Run()
	if err != nil {
		return nil, fmt.Errorf("error getting %s resources: %v: %s", k8sType, err, stderrJSON.String())
	}

	var resourceJSON map[string]interface{}
	if err := json.Unmarshal(outJSON.Bytes(), &resourceJSON); err != nil {
		return nil, fmt.Errorf("error parsing JSON: %v", err)
	}

	return &K8sResources{
		List: outList.String(),
		JSON: resourceJSON,
	}, nil
}
