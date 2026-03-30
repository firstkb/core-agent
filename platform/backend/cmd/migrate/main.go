package main

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	migratecmd "dtriton.com/platform/backend/cmd/migrate/internal"
	"dtriton.com/platform/backend/internal/platform/hosting"
	"dtriton.com/platform/backend/internal/platform/options"
)

var (
	Version = "0.0.0"
	Build   = "dev"
)

var serviceHost = hosting.ServiceHost{
	Name:        "MIGRATE",
	DisplayName: "Backend Migrate",
	Description: "Backend migration runtime",
	Version:     Version,
	Logger:      slog.Default(),
}

var envPrefixes = []string{serviceHost.Name + "_", "AWS_"}

var defaultConfiguration []byte

var migrationRunner hosting.HostedService = &migratecmd.Runner{}

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

	args := serviceHost.Initialize(appOptions, defaultConfiguration, envPrefixes)
	serviceHost.Run(&migrationRunner, args)
}
