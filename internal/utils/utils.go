package utils

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/codefresh-support/codefresh-support-package/internal/k8s"
	"gopkg.in/yaml.v2"
)

const (
	VERSION        = "__APP_VERSION__"
	numOfProcesses = 5
)

var (
	timestamp         = time.Now().Unix()
	dirPath           = fmt.Sprintf("./codefresh-support-%d", timestamp)
	supportPackageZip = fmt.Sprintf("./codefresh-support-package-%d.zip", timestamp)
	k8sResourceTypes  = []string{
		"Applications",
		"ApplicationSets",
		"Configmaps",
		"CronJobs",
		"DaemonSets",
		"Deployments",
		"Jobs",
		"Nodes",
		"PersistentVolumeClaims",
		"PersistentVolumes",
		"Pods",
		"ServiceAccounts",
		"Services",
		"StatefulSets",
		"Storageclass",
	}
)

func WriteCodefreshFiles(data interface{}, name string) error {
	filePath := filepath.Join(dirPath, fmt.Sprintf("%s.yaml", name))
	fileContent, err := yaml.Marshal(data)
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, fileContent, 0644)
}

func writeGetApiCalls(resources []map[string]interface{}, k8sType string) error {
	var wg sync.WaitGroup
	sem := make(chan struct{}, numOfProcesses)

	for _, item := range resources {
		wg.Add(1)
		go func(item map[string]interface{}) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			filePath := filepath.Join(dirPath, k8sType, fmt.Sprintf("%s.yaml", item["metadata"].(map[string]interface{})["name"]))
			fileContent, err := yaml.Marshal(item)
			if err != nil {
				fmt.Println("Error marshaling YAML:", err)
				return
			}
			if err := os.WriteFile(filePath, fileContent, 0644); err != nil {
				fmt.Println("Error writing file:", err)
			}
		}(item)
	}

	wg.Wait()
	return nil
}

func PrepareAndCleanup() error {
	fmt.Printf("Saving data to %s\n", supportPackageZip)
	if err := zipDirectory(); err != nil {
		return err
	}

	fmt.Println("Cleaning up temp directory")
	if err := os.RemoveAll(dirPath); err != nil {
		return err
	}

	fmt.Printf("\nPlease attach %s to your support ticket.\n", supportPackageZip)
	return nil
}

func zipDirectory() error {
	// Create the zip file
	outFile, err := os.Create(supportPackageZip)
	if err != nil {
		return err
	}
	defer outFile.Close()

	// Create a new zip archive
	zipWriter := zip.NewWriter(outFile)
	defer zipWriter.Close()

	// Walk through the directory
	return filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Create the zip header
		relPath, err := filepath.Rel(dirPath, path)
		if err != nil {
			return err
		}
		if info.IsDir() {
			// Skip directories (they're implied in the zip structure)
			return nil
		}

		// Create a file header
		zipFileHeader, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}
		zipFileHeader.Name = relPath
		zipFileHeader.Method = zip.Deflate

		// Create the file writer
		zipFileWriter, err := zipWriter.CreateHeader(zipFileHeader)
		if err != nil {
			return err
		}

		// Open the source file
		sourceFile, err := os.Open(path)
		if err != nil {
			return err
		}
		defer sourceFile.Close()

		// Copy the file contents to the zip writer
		_, err = io.Copy(zipFileWriter, sourceFile)
		return err
	})
}

func FetchAndSaveData(namespace string) error {
	for _, k8sType := range k8sResourceTypes {
		dir := filepath.Join(dirPath, k8sType)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("error creating directory %s: %v", dir, err)
		}

		fmt.Printf("Gathering %s data...\n", k8sType)

		labelSelector := ""
		if k8sType == "PersistentVolumeClaims" || k8sType == "PersistentVolumes" {
			labelSelector = "io.codefresh.accountName"
		}

		resourceJSON, resourceList, err := k8s.GetK8sResources(k8sType, namespace, labelSelector)
		if err != nil {
			fmt.Printf("Error getting %s resources: error: the server doesn't have a resource type \"%s\"\n", k8sType, k8sType)
			continue
		}

		listFilePath := filepath.Join(dirPath, k8sType, fmt.Sprintf("_%sList.txt", k8sType))
		if err := os.WriteFile(listFilePath, []byte(resourceList), 0644); err != nil {
			return fmt.Errorf("error writing file %s: %v", listFilePath, err)
		}

		if k8sType == "PersistentVolumeClaims" || k8sType == "PersistentVolumes" {
			if len(resourceJSON["items"].([]interface{})) != 0 {
				if err := writeGetApiCalls(resourceJSON["items"].([]map[string]interface{}), k8sType); err != nil {
					return err
				}
			}
			continue
		}

		sem := make(chan struct{}, numOfProcesses)

		if k8sType == "Pods" {
			var wg sync.WaitGroup
			for _, resource := range resourceJSON["items"].([]interface{}) {
				podName := resource.(map[string]interface{})["metadata"].(map[string]interface{})["name"].(string)
				containers := resource.(map[string]interface{})["spec"].(map[string]interface{})["containers"].([]interface{})

				for _, container := range containers {
					wg.Add(1)
					go func(containerName string) {
						defer wg.Done()
						sem <- struct{}{}
						defer func() { <-sem }()

						log, err := k8s.GetK8sLogs(namespace, podName, containerName)
						if err != nil {
							fmt.Printf("Error getting logs for pod %s container %s: %v\n", podName, containerName, err)
							return
						}

						logFileName := filepath.Join(dirPath, k8sType, fmt.Sprintf("%s_%s.log", podName, containerName))
						if err := os.WriteFile(logFileName, []byte(log), 0644); err != nil {
							fmt.Printf("Error writing log file %s: %v\n", logFileName, err)
						}
					}(container.(map[string]interface{})["name"].(string))
				}
			}
			wg.Wait()
		}

		var wg sync.WaitGroup
		for _, resource := range resourceJSON["items"].([]interface{}) {
			wg.Add(1)
			go func(resourceName string) {
				defer wg.Done()
				sem <- struct{}{}
				defer func() { <-sem }()

				describeOutput, err := k8s.DescribeK8sResources(k8sType, namespace, resourceName)
				if err != nil {
					fmt.Printf("Error describing resource %s: %v\n", resourceName, err)
					return
				}

				describeFileName := filepath.Join(dirPath, k8sType, fmt.Sprintf("%s.yaml", resourceName))
				if err := os.WriteFile(describeFileName, []byte(describeOutput), 0644); err != nil {
					fmt.Printf("Error writing describe file %s: %v\n", describeFileName, err)
				}
			}(resource.(map[string]interface{})["metadata"].(map[string]interface{})["name"].(string))
		}
		wg.Wait()
	}

	events, err := k8s.GetK8sEvents(namespace)
	if err != nil {
		return fmt.Errorf("error getting events: %v", err)
	}
	if err := os.WriteFile(filepath.Join(dirPath, "Events.txt"), []byte(events), 0644); err != nil {
		return fmt.Errorf("error writing events file: %v", err)
	}

	if err := os.WriteFile(filepath.Join(dirPath, "cf-support-version.txt"), []byte(VERSION), 0644); err != nil {
		return fmt.Errorf("error writing version file: %v", err)
	}

	return nil
}
