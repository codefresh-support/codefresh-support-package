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

var onpremNamespace string

// onpremCmd represents the onprem command
var onpremCmd = &cobra.Command{
	Use:   "onprem",
	Short: "Collect data for the Codefresh OnPrem Installation",
	Long:  `Collect data for the Codefresh OnPrem Installation`,
	Run: func(cmd *cobra.Command, args []string) {
		const RuntimeType = "Codefresh OnPrem"
		dirPath := fmt.Sprintf("./codefresh-support-%d", time.Now().Unix())
		cfConfig, err := codefresh.GetCodefreshCreds()
		if err != nil {
			cmd.PrintErrln("Error getting Codefresh credentials:", err)
			cfConfig = nil
		}

		if cfConfig != nil && cfConfig.BaseURL == "https://g.codefresh.io/api" {
			cmd.PrintErrln("Cannot gather On-Prem data for Codefresh SaaS. If you need to gather data for Codefresh On-Prem, please update your ./cfconfig context (or Envs) to point to an On-Prem instance.")
			cmd.PrintErrln("For Codefresh SaaS, use 'pipelines' or 'gitops' commands.")
			return
		}

		if onpremNamespace == "" {
			var err error
			onpremNamespace, err = k8s.SelectNamespace(RuntimeType)
			if err != nil {
				cmd.PrintErrln("Error selecting namespace:", err)
				return
			}
		}

		cmd.Printf("Gathering data in %s namespace for %s...\n", onpremNamespace, RuntimeType)

		K8sResources := append(k8s.K8sGeneral, k8s.K8sClassicOnPrem...)

		if err := utils.FetchAndSaveData(onpremNamespace, K8sResources, dirPath, Version); err != nil {
			cmd.PrintErrln("Error fetching and saving data:", err)
			return
		}

		if cfConfig != nil {
			onpremAccounts, err := codefresh.OnPremAccounts(cfConfig)
			if err != nil {
				cmd.PrintErrln("Error fetching On-Prem accounts:", err)
				return
			}
			if err := utils.WriteYaml(onpremAccounts, "onprem-accounts", dirPath); err != nil {
				cmd.PrintErrln("Error writing On-Prem accounts:", err)
				return
			}

			onpremRuntimes, err := codefresh.OnPremRuntimes(cfConfig)
			if err != nil {
				cmd.PrintErrln("Error fetching On-Prem runtimes:", err)
				return
			}
			if err := utils.WriteYaml(onpremRuntimes, "onprem-runtimes", dirPath); err != nil {
				cmd.PrintErrln("Error writing On-Prem runtimes:", err)
				return
			}

			onpremUsers, err := codefresh.OnPremUsers(cfConfig)
			if err != nil {
				cmd.PrintErrln("Error fetching On-Prem users:", err)
				return
			}
			if err := utils.WriteYaml(onpremUsers, "onprem-users", dirPath); err != nil {
				cmd.PrintErrln("Error writing On-Prem users:", err)
				return
			}

			onpremFeatureFlags, err := codefresh.OnPremFeatureFlags(cfConfig)
			if err != nil {
				cmd.PrintErrln("Error fetching On-Prem feature flags:", err)
				return
			}
			if err := utils.WriteYaml(onpremFeatureFlags, "onprem-feature-flags", dirPath); err != nil {
				cmd.PrintErrln("Error writing On-Prem feature flags:", err)
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
	rootCmd.AddCommand(onpremCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// onpremCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// onpremCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
	onpremCmd.Flags().StringVarP(&onpremNamespace, "namespace", "n", "", "The namespace where Codefresh OnPrem is installed")
}
