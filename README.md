Block Explorer
===========

![build](https://img.shields.io/github/actions/workflow/status/Constellation-Labs/block_explorer/release.yml?label=build)
![version](https://img.shields.io/github/v/release/Constellation-Labs/block_explorer?sort=semver)

Block Explorer exposes API functions to retrieve on-chain data from an opensearch database cluster.

## Build and Run

### Prerequisites

1. [TypeScript](https://www.typescriptlang.org/id/download)
2. [Serverless Framework](https://www.serverless.com/framework/docs/getting-started/)
3. [Docker Desktop](https://www.docker.com/get-started/)

### Opensearch
An opensearch cluster is used to store and query the on-chain data. You have several options to set up the backend locally:

<details><summary>Integrate with tessellation cluster</summary>

If you are running a local tessellation cluster and want to stream the data to an opensearch cluster, you can follow the instructions to setup [snapshot streaming](https://github.com/Constellation-Labs/snapshot-streaming), which sets up the opensearch cluster and data integration.

</details>

<details><summary>Integrate using a local opensearch cluster</summary>

If you don't want to setup a local tessellation cluster with snapshot streaming, you can run a stand-alone opensearch instance and use that as the local backend of block explorer.

 - Start docker desktop and modify the [vm.max_map_count](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html#_windows_and_macos_with_docker_desktop) configuration

 - Start the local opensearch cluster using this command:
```
docker-compose -f ./localdev/docker-compose-opensearch.yml up
```

You can browse the opensearch cluster dashboard on [http://localhost:5601](http://localhost:5601)

You'll need to create the opensearch indexes & add some sample data if you want to test the APIs with data. 
</details>

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
