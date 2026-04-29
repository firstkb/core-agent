package store

import (
	"encoding/json"
)

func jsonString(value any, fallback string) (string, error) {
	if value == nil {
		return fallback, nil
	}
	body, err := json.Marshal(value)
	if err != nil {
		return "", err
	}
	return string(body), nil
}

func anyFromJSON(raw []byte, fallback any) (any, error) {
	if len(raw) == 0 {
		return fallback, nil
	}
	var out any
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	if out == nil {
		return fallback, nil
	}
	return out, nil
}
