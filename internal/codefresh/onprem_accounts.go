package codefresh

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func OnPremAccounts(cfConfig *CodefreshConfig) (interface{}, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/admin/accounts", cfConfig.BaseURL), nil)
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
		return nil, fmt.Errorf("failed to get accounts: %s", resp.Status)
	}

	var accounts interface{}
	if err := json.NewDecoder(resp.Body).Decode(&accounts); err != nil {
		return nil, err
	}

	return accounts, nil
}
