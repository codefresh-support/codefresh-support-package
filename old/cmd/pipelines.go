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

	"github.com/codefresh-support/codefresh-support-package/internal/codefresh"
	"github.com/codefresh-support/codefresh-support-package/internal/k8s"
	"github.com/codefresh-support/codefresh-support-package/internal/utils"
	"github.com/spf13/cobra"
)

var pipelinesNamespace string
var pipelinesRuntime string

// pipelinesCmd represents the pipelines command
var pipelinesCmd = &cobra.Command{
	Use:   "pipelines",
	Short: "Collect data for the Codefresh Pipelines Runtime",
	Long:  `Collect data for the Codefresh Pipelines Runtime`,
	Run: func(cmd *cobra.Command, args []string) {
		const RuntimeType = "Codefresh Pipelines Runtime"
		var runtimes []map[string]interface{}
		var reSpec map[string]interface{}

		dirPath := fmt.Sprintf("./codefresh-support-%d", time.Now().Unix())

		cfConfig, err := codefresh.GetCodefreshCreds()
		if err != nil {
			cmd.PrintErrln("Error getting Codefresh credentials:", err)
		}

		if cfConfig != nil {
			if pipelinesRuntime != "" {
				reSpec, err = codefresh.SingleRuntime(cfConfig, pipelinesRuntime)
				if err != nil {
					cmd.PrintErrln("Error getting Codefresh runtimes:", err)
				}

			} else {
				runtimes, err = codefresh.AccountRuntimes(cfConfig)
				if err != nil {
					cmd.PrintErrln("Error getting Codefresh runtimes:", err)
				}

				if len(runtimes) != 0 {
					var selection int
					for index, runtime := range runtimes {
						cmd.Printf("%d. %s\n", index+1, runtime["metadata"].(map[string]interface{})["name"])
					}
					for {
						cmd.Print("\nPlease select the runtime to gather data from (Number): ")
						_, err := fmt.Scanf("%d", &selection)
						if err != nil || selection < 1 || selection > len(runtimes) {
							cmd.PrintErrln("Invalid selection. Please enter a number corresponding to one of the listed runtimes.")
							continue
						}
						break

					}
					reSpec = runtimes[selection-1]
				}

			}
		}

		if pipelinesNamespace == "" {
			if reSpec != nil {
				pipelinesNamespace = reSpec["runtimeScheduler"].(map[string]interface{})["cluster"].(map[string]interface{})["namespace"].(string)
			} else {
				pipelinesNamespace, err = k8s.SelectNamespace(RuntimeType)
				if err != nil {
					cmd.PrintErrf("error getting Kubernetes namespace: %v", err)
					return
				}
			}
		}

		cmd.Printf("Gathering data in %s namespace for %s...\n", pipelinesNamespace, RuntimeType)

		K8sResources := append(k8s.K8sGeneral, k8s.K8sClassicOnPrem...)

		if err := utils.FetchAndSaveData(pipelinesNamespace, K8sResources, dirPath, Version); err != nil {
			cmd.PrintErrln("Error fetching and saving data:", err)
			return
		}

		if reSpec != nil {
			if err := utils.WriteYaml(reSpec, "pipelines-runtime-spec", dirPath); err != nil {
				cmd.PrintErrln("Error writing runtime spec:", err)
				return
			}
		}

		cmd.Println("Data Gathered Successfully.")

		if err := utils.PreparePackage(strings.ReplaceAll(strings.ToLower(RuntimeType), " ", "-"), dirPath); err != nil {
			cmd.PrintErrln("Error preparing package:", err)
			return
		}

	},
}

func init() {
	rootCmd.AddCommand(pipelinesCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// pipelinesCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// pipelinesCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
	pipelinesCmd.Flags().StringVarP(&pipelinesNamespace, "namespace", "n", "", "The namespace where the Runtime is installed")
	pipelinesCmd.Flags().StringVarP(&pipelinesRuntime, "runtime", "re", "", "The name of the Pipelines Runtime")
}
