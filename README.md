# Block Explorer

![build](https://img.shields.io/github/actions/workflow/status/Constellation-Labs/block_explorer/release.yml?label=build)
![version](https://img.shields.io/github/v/release/Constellation-Labs/block_explorer?sort=semver)

The Block Explorer provides API functions to retrieve on-chain data from a Constellation Network indexer. The service uses PostgreSQL for data storage and retrieval and the Serverless framework for API deployment.

## Table of Contents

- [Block Explorer](#block-explorer)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
  - [Development](#development)
    - [Database Setup](#database-setup)
    - [API Development](#api-development)
  - [Testing](#testing)
  - [API Documentation](#api-documentation)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [TypeScript](https://www.typescriptlang.org/download)
- [Docker](https://www.docker.com/get-started/)
- [Serverless Framework](https://www.serverless.com/framework/docs/getting-started/)

## Quick Start

1. Clone the repository
   ```bash
   git clone https://github.com/Constellation-Labs/block_explorer.git
   cd block_explorer
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the PostgreSQL database
   ```bash
   npm run db:start
   ```

4. Run the API locally
   ```bash
   serverless offline
   ```

## Development

### Database Setup

The project uses PostgreSQL for data storage. A Docker Compose configuration is provided for easy setup:

```bash
# Start the PostgreSQL container
npm run db:start

# To stop the container when finished
npm run db:stop
```

The database configuration is stored in `.env` and can be customized as needed.

### API Development

Start the serverless offline host to test API endpoints locally:

```bash
serverless offline
```

This will display a list of available endpoints that can be called locally.

## Testing

Run tests with the following commands:

```bash
# Start the database if not already running
npm run db:start

# Run tests (this will reset and seed the database automatically)
npm run test
```

The test suite uses Jest and automatically resets the database schema before each test run.

## API Documentation

API endpoints are defined in the `routes/` directory with their handlers in `src/handlers/`.

Available endpoints include:
- DAG operations
- Metagraph information
- Token locks
- Actions
- Allow spends
