package utils

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"time"
)

func PreparePackage(selectedRuntime, dirPath string) error {
	supportPackageZip := fmt.Sprintf("./%s-%d.tar.gz", selectedRuntime, time.Now().Unix())
	fmt.Printf("Saving data to %s\n", supportPackageZip)
	cmd := exec.Command("tar", "-czf", supportPackageZip, dirPath)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	err := cmd.Run()

	if err != nil {
		return fmt.Errorf("error creating tar file: %v: %s", err, stderr.String())
	}

	fmt.Println("Cleaning up temp directory")
	err = os.RemoveAll(dirPath)

	if err != nil {
		return fmt.Errorf("error removing temp directory: %v", err)
	}

	fmt.Printf("\nPlease attach %s to your support ticket.\n", supportPackageZip)
	return nil
}
