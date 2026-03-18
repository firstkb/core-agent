# AWS CDK Standard Notes

## Design-level expectations

1. Define account, region, and environment boundaries up front.
2. Capture construct layering and cross-stack dependency model.
3. Document IAM least-privilege assumptions for runtime and deploy roles.
4. Specify deployment safety: rollback, drift checks, and failure handling.
5. Map operational signals such as logs, metrics, and alarms for critical resources.
