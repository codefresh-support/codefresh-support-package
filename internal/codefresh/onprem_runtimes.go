package codefresh

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func OnPremRuntimes(cfConfig *CodefreshConfig) (interface{}, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/admin/runtime-environments", cfConfig.BaseURL), nil)
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
		return nil, fmt.Errorf("failed to get runtimes: %s", resp.Status)
	}

	var runtimes interface{}
	if err := json.NewDecoder(resp.Body).Decode(&runtimes); err != nil {
		return nil, err
	}

	return runtimes, nil
}
