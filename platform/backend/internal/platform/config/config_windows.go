//go:build windows

package config

import (
	"os"
	"path/filepath"

	"dtriton.com/platform/backend/internal/platform/appinfo"
)

// <application_path>/<appname>.conf
func getGlobalConfigFilePath() (string, error) {
	appDir := appinfo.GetAppDir()

	return filepath.Abs(filepath.Join(appDir, appinfo.GetAppName()+defaultConfigFileExt))
}

// %USERPROFILE%/<appname>/<appname>.conf
func getLocalConfigFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return filepath.Abs(filepath.Join(homeDir, appinfo.GetAppName(), appinfo.GetAppName()+defaultConfigFileExt))
}
