package codefresh

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func OnPremUsers(cfConfig *CodefreshConfig) (interface{}, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/admin/user?limit=1&page=1", cfConfig.BaseURL), nil)
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
		return nil, fmt.Errorf("failed to get users: %s", resp.Status)
	}

	var users interface{}
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, err
	}

	return users, nil
}
