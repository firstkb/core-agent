# Testing Standard

## Priority rule

Cover critical paths first:

1. Core business flows.
2. Auth, permission, and failure paths.
3. Data integrity boundaries such as validation, persistence, and state transitions.
4. Regression-prone changed areas.

## Coverage shape

1. Many unit tests.
2. Some integration tests.
3. Few end-to-end tests for critical journeys.

## Test structure

Prefer Arrange -> Act -> Assert.

## What to test

1. Public APIs and business logic.
2. Error handling and edge cases.
3. Data transformation and contract boundaries.

## Mocking

Mock external dependencies such as network, databases, filesystem, time, or randomness, not the code under test.
