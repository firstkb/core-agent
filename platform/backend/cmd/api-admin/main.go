package main

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	"dtriton.com/platform/backend/cmd/api-admin/internal"
	"dtriton.com/platform/backend/internal/platform/hosting"
	"dtriton.com/platform/backend/internal/platform/options"
)

var (
	Version = "0.0.0"
	Build   = "dev"
)

var serviceHost = hosting.ServiceHost{
	Name:        "ADMINAPI",
	DisplayName: "Admin API",
	Description: "Admin API Server",
	Version:     Version,
	Logger:      slog.Default(),
}

// Prefixes to filter the env vars. The envPrefixes[0] will be stripped from the key.
// Examples:
//
//	prefixes: "ADMINAPI_", "AWS_"
//	env name: "ADMINAPI_TLS_CERT", "AWS_S3_ACCESS_KEY"
//	key:      tls.cert, aws.s3.access.key
var envPrefixes = []string{serviceHost.Name + "_", "AWS_"}

var defaultConfiguration []byte

var apiServer hosting.HostedService = &internal.HostedService{}

func init() {
	loc, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to set time zone: %v\n", err)
		return
	}
	time.Local = loc
}

func main() {
	if Build != "" {
		serviceHost.Version = Version + "." + Build
		os.Setenv("MIGRATION_VERSION", serviceHost.Version)
	}

	appOptions, err := options.NewOptions(serviceHost.Name)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	host := appOptions.String(internal.FlagHost, "", " [address][:port]\vIP address and/or port to listen on", true)

	args := serviceHost.Initialize(appOptions, defaultConfiguration, envPrefixes)

	if len(*host) > 0 && serviceHost.Config != nil {
		serviceHost.Config.Set(internal.FlagHost, *host)
	}

	serviceHost.Run(&apiServer, args)
}
