//go:build !windows && !nacl && !plan9

package config

import (
	"os"
	"path/filepath"

	"dtriton.com/platform/backend/internal/platform/appinfo"
)

// /etc/<appname>/<appname>.conf
func getGlobalConfigFilePath() (string, error) {
	return filepath.Abs(filepath.Join("/etc/", appinfo.GetAppName(), appinfo.GetAppName()+defaultConfigFileExt))
}

// $HOME/.config/<appname>/<appname>.conf
func getLocalConfigFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return filepath.Abs(filepath.Join(homeDir, ".config", appinfo.GetAppName(), appinfo.GetAppName()+defaultConfigFileExt))
}
