# ESS Smart App

### This app contains ESS Smart App

## About

ESS Smart App is a cutting-edge application designed to enhance safety systems through early risk prevention.

## Features

- **User Authentication**: Secure login with AWS Cognito.
- **Material UI Integration**: Modern and responsive UI components.
- **Multilingual Support**: Supports multiple languages.
- **Offline mod**: Offline work is supported by storing data in IndexDB

## Project Structure

The project is organized as follows:

- **`package.json`**: Contains project dependencies and scripts.
- **`tsconfig.json`**: TypeScript configuration.
- **`vite.config.ts`**: Vite configuration for optimized build and development.

- **`src/`**: Main source directory.
  - **`components/`**: UI components including:
    - **`layouts/`**: Layout components for public and private routes.
    - **`widgets/`**: Various interactive widgets like checklist, image upload, etc.
  - **`config/`**: Configuration files, including client settings and AWS Cognito configuration.
  - **`contexts/`**: Contexts for managing application state, such as authentication and online status.
  - **`db/`**: Database repositories for offline data management.
  - **`hooks/`**: Custom React hooks, e.g., for authentication and sync status.
  - **`pages/`**: Pages for routing, including `Login`, `Dashboard`, and other main views.
  - **`providers/`**: Context providers for data and service layers.
  - **`routes/`**: App routing configuration.
  - **`services/`**: Service modules for handling app logic.
  - **`theme/`**: Application theme setup.

## Installation

To get started with the ESS Smart App, clone the repository and install the dependencies:

```bash
git clone https://github.com/esafesys-eng/ess-smart-app.git
cd ess-smart-app
pnpm install