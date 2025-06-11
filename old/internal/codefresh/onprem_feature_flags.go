package codefresh

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func OnPremFeatureFlags(cfConfig *CodefreshConfig) (interface{}, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/admin/features", cfConfig.BaseURL), nil)
	if err != nil {
		return nil, err
	}
	for key, value := range cfConfig.Headers {
		req.Header.Set(key, value)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get feature flags: %s", resp.Status)
	}

	var featureFlags interface{}
	if err := json.NewDecoder(resp.Body).Decode(&featureFlags); err != nil {
		return nil, err
	}

	return featureFlags, nil
}
