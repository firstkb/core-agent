# Go Backend Standard Notes

## Design-level expectations

1. Keep clear package boundaries and dependency direction.
2. Make context propagation explicit in service and repository calls.
3. Define stable DTO and error contracts at transport boundaries.
4. Prefer deterministic initialization and explicit wiring.
5. Capture persistence consistency strategy such as transactions, retries, and idempotency.
