/*
Copyright © 2025 Codefresh Support <support@codefresh.io>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
package cmd

import (
	"fmt"
	"strings"
	"time"

	"github.com/codefresh-support/codefresh-support-package/internal/k8s"
	"github.com/codefresh-support/codefresh-support-package/internal/utils"
	"github.com/spf13/cobra"
)

var gitOpsNamespace string

// gitopsCmd represents the gitops command
var gitopsCmd = &cobra.Command{
	Use:   "gitops",
	Short: "Collect data for the Codefresh GitOps Runtime",
	Long:  `Collect data for the Codefresh GitOps Runtime`,
	Run: func(cmd *cobra.Command, args []string) {
		const RuntimeType = "Codefresh GitOps Runtime"
		dirPath := fmt.Sprintf("./codefresh-support-%d", time.Now().Unix())
		if gitOpsNamespace == "" {
			var err error
			gitOpsNamespace, err = k8s.SelectNamespace(RuntimeType)
			if err != nil {
				cmd.PrintErrln("Error selecting namespace:", err)
				return
			}
		}
		cmd.Printf("Gathering data in %s namespace for %s...\n", gitOpsNamespace, RuntimeType)

		K8sResources := append(k8s.K8sGeneral, append(k8s.K8sGitOps, k8s.K8sArgo...)...)

		if err := utils.FetchAndSaveData(gitOpsNamespace, K8sResources, dirPath); err != nil {
			cmd.PrintErrln("Error fetching and saving data:", err)
			return
		}

		cmd.Println("Data Gathered Successfully.")

		if err := utils.PreparePackage(strings.ReplaceAll(strings.ToLower(RuntimeType), " ", "-"), dirPath); err != nil {
			cmd.PrintErrln("Error preparing package:", err)
			return
		}
	},
}

func init() {
	rootCmd.AddCommand(gitopsCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// gitopsCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// gitopsCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
	gitopsCmd.Flags().StringVarP(&gitOpsNamespace, "namespace", "n", "", "The namespace where the Runtime is installed")

}
