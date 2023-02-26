Block Explorer
===========

![build](https://img.shields.io/github/actions/workflow/status/Constellation-Labs/block_explorer/release.yml?label=build)
![version](https://img.shields.io/github/v/release/Constellation-Labs/block_explorer?sort=semver)

Block Explorer exposes API functions to retrieve on-chain data from a tessellation opensearch database cluster.

## Build and Run

### Prerequisites

1. [TypeScript](https://www.typescriptlang.org/id/download)
2. [Serverless Framework](https://www.serverless.com/framework/docs/getting-started/)
3. [Docker Desktop](https://www.docker.com/get-started/) with [Kubernetes](https://docs.docker.com/desktop/kubernetes/) enabled

### Setup local development cluster
An [opensearch](https://aws.amazon.com/what-is/opensearch/) instance is used to store and query the on-chain data.

Follow the instructions from the [snapshot streaming](https://github.com/Constellation-Labs/snapshot-streaming) repository which sets up your local tessellation development cluster along with an opensearch instance (hosted on port `4510`). 

### Run
Install the npm packages from the project directory:
```
npm install
```

Start the serverless offline host to test the APIs locally:
```
serverless offline
```

The output of this command shows an overview of the function URL's that can be called locally.

## Unit Tests


Run the unit tests locally:
```
npm run test
```
