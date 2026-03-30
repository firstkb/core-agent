//go:build windows

package options

import (
	"os"
	"path/filepath"

	"dtriton.com/platform/backend/internal/platform/appinfo"
)

// <application_path>/.env
func getGlobalEnvFilePath() (string, error) {
	appDir := appinfo.GetAppDir()

	return filepath.Abs(filepath.Join(appDir, defaultEnvFileName))
}

// %USERPROFILE%/<appname>/.env
func getLocalEnvFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return filepath.Abs(filepath.Join(homeDir, appinfo.GetAppName(), defaultEnvFileName))
}
