package codefresh

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"gopkg.in/yaml.v2"
)

type CodefreshConfig struct {
	Headers map[string]string
	BaseURL string
}

type Context struct {
	Token string `yaml:"token"`
	URL   string `yaml:"url"`
}

type Config struct {
	Contexts       map[string]Context `yaml:"contexts"`
	CurrentContext string             `yaml:"current-context"`
}

func GetCodefreshCreds() (*CodefreshConfig, error) {
	envToken := os.Getenv("CF_API_KEY")
	envUrl := os.Getenv("CF_URL")

	if envToken != "" && envUrl != "" {
		return &CodefreshConfig{
			Headers: map[string]string{"Authorization": envToken},
			BaseURL: fmt.Sprintf("%s/api", envUrl),
		}, nil
	}

	var configPath string
	if runtime.GOOS == "windows" {
		configPath = filepath.Join(os.Getenv("USERPROFILE"), ".cfconfig")
	} else {
		configPath = filepath.Join(os.Getenv("HOME"), ".cfconfig")
	}

	configFileContent, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var config Config
	if err := yaml.Unmarshal(configFileContent, &config); err != nil {
		return nil, err
	}

	currentContext, exists := config.Contexts[config.CurrentContext]
	if !exists {
		return nil, errors.New("current context not found in Codefresh config")
	}

	return &CodefreshConfig{
		Headers: map[string]string{"Authorization": currentContext.Token},
		BaseURL: fmt.Sprintf("%s/api", currentContext.URL),
	}, nil
}
