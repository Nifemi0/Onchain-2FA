# Onchain-2FA Monorepo

This repository contains the monorepo for the Onchain 2FA project, including the frontend, backend services (oracle and trap authenticator), and smart contracts.

## Table of Contents

*   [Project Structure](#project-structure)
*   [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
    *   [Running Locally with Docker Compose](#running-locally-with-docker-compose)
*   [Frontend](#frontend)
*   [Backend](#backend)
*   [Oracle](#oracle)
*   [Contracts](#contracts)
*   [Contributing](#contributing)
*   [License](#license)

## Project Structure

```
Onchain-2FA/
├── backend/                 # Main backend services
│   ├── server.js            # Main entry point for Trap Authenticator
│   ├── routes/              # Express routes
│   ├── controllers/         # Route handlers
│   ├── middlewares/         # Reusable middlewares
│   ├── config/              # Env vars, DB, etc.
│   ├── tests/               # Unit/integration tests
│   └── package.json
│
├── frontend/                # Next.js frontend application
│   ├── index.html           # Placeholder for static export
│   ├── src/                 # Main source code
│   │   ├── components/      # UI components
│   │   ├── services/        # API client
│   │   ├── utils/           # Helper functions
│   │   ├── styles/          # Global CSS/Tailwind
│   │   └── App.jsx          # Main application component
│   ├── vite.config.js       # Placeholder (Next.js uses next.config.ts)
│   ├── netlify.toml         # Netlify deployment configuration
│   ├── next.config.ts       # Next.js configuration
│   └── package.json
│
├── oracle/                  # Oracle service
│   ├── index.js             # Main entry point
│   ├── config/              # Configuration files (e.g., .env.example)
│   └── package.json
│
├── contracts/               # Foundry smart contract project
│   ├── lib/                 # Foundry libraries
│   ├── script/              # Deployment scripts
│   ├── src/                 # Contract source code
│   ├── test/                # Contract tests
│   └── foundry.toml
│
├── misc/                    # Miscellaneous tools and projects
│   ├── e2e-tests/           # End-to-end tests
│   └── sandbox/             # Sandbox environment
│
├── .env.example             # Document required environment variables
├── docker-compose.yml       # Docker Compose setup for local development
├── .github/workflows/ci.yml # GitHub Actions for CI/CD
├── README.md                # Project overview and setup
├── LICENSE                  # Project license
└── CONTRIBUTING.md          # Contribution guidelines
```

## Getting Started

### Prerequisites

*   Node.js (v20 or later)
*   npm or yarn
*   Docker and Docker Compose (for local development)
*   Foundry (for smart contract development)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Nifemi0/Onchain-2FA.git
    cd Onchain-2FA
    ```

2.  **Install root dependencies:**
    ```bash
    npm install # or yarn install
    ```

3.  **Install workspace dependencies:**
    ```bash
    npm install -ws # or yarn install
    ```

4.  **Set up environment variables:**
    Copy the `.env.example` file to `.env` in the root, `backend/config/`, and `oracle/config/` directories, and fill in the required values.
    ```bash
    cp .env.example .env
    cp backend/trap-authenticator/.env.example backend/trap-authenticator/.env
    cp oracle/config/.env.example oracle/config/.env
    # Fill in your actual environment variables in these .env files
    ```

### Running Locally with Docker Compose

To spin up the entire project (frontend, backend, oracle) locally using Docker Compose:

```bash
# Ensure your .env files are configured
docker-compose up --build
```

This will start the services, and you can access:
*   Frontend: `http://localhost:3000`
*   Backend: `http://localhost:3001`
*   Oracle: `http://localhost:4430`

## Frontend

The frontend is a Next.js application. Refer to the `frontend/` directory for more details.

## Backend

The backend is an Express.js application that serves as the Trap Authenticator. Refer to the `backend/` directory for more details.

## Oracle

The oracle service is responsible for interacting with the blockchain. Refer to the `oracle/` directory for more details.

## Contracts

The smart contracts are developed using Foundry. Refer to the `contracts/` directory for more details.

## Contributing

We welcome contributions! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.