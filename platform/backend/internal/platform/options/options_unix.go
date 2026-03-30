//go:build !windows && !nacl && !plan9

package options

import (
	"os"
	"path/filepath"

	"dtriton.com/platform/backend/internal/platform/appinfo"
)

// /etc/<appname>/.env
func getGlobalEnvFilePath() (string, error) {
	return filepath.Abs(filepath.Join("/etc/", appinfo.GetAppName(), defaultEnvFileName))
}

// $HOME/.config/<appname>/.env
func getLocalEnvFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return filepath.Abs(filepath.Join(homeDir, ".config", appinfo.GetAppName(), defaultEnvFileName))
}
