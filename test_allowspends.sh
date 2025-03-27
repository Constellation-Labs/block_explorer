#!/bin/bash

BASE_URL="http://localhost:3001"

echo "General Allow-Spend Endpoints"
curl -X GET "http://localhost:3001/allow-spends"
curl -X GET "http://localhost:3001/spend-transactions"
curl -X GET "http://localhost:3001/allow-spend-expirations"

echo "Global Snapshot Endpoints"
curl -X GET "http://localhost:3001/global-snapshots/618a6f6bedba2c8a84ca3513f1cf0f6fe9eafb6f7872eecf2e222216351708b6/allow-spends"
curl -X GET "http://localhost:3001/global-snapshots/618a6f6bedba2c8a84ca3513f1cf0f6fe9eafb6f7872eecf2e222216351708b6/spend-transactions"
curl -X GET "http://localhost:3001/global-snapshots/618a6f6bedba2c8a84ca3513f1cf0f6fe9eafb6f7872eecf2e222216351708b6/allow-spend-expirations"

echo "Address-Specific Endpoints"
curl -X GET "http://localhost:3001/addresses/DAG04Qob76gZG7D5qZu9oeZvr8WFxs53Md383q4x/allow-spends"
curl -X GET "http://localhost:3001/addresses/DAG04Qob76gZG7D5qZu9oeZvr8WFxs53Md383q4x/spend-transactions"
curl -X GET "http://localhost:3001/addresses/DAG04Qob76gZG7D5qZu9oeZvr8WFxs53Md383q4x/allow-spend-expirations"

echo "Currency (Metagraph) Endpoints"
curl -X GET "http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/allow-spends"
curl -X GET "http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/spend-transactions"
curl -X GET "http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/allow-spend-expirations"

echo "Currency Snapshot Endpoints"
curl -X GET "http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/snapshots/74dff07f4ff96e2dc7cea2420389515e6ccbb49f2dd0115ecfa38e4e55cd666d/allow-spends"
curl -X GET "http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/snapshots/74dff07f4ff96e2dc7cea2420389515e6ccbb49f2dd0115ecfa38e4e55cd666d/spend-transactions"
curl -X GET "http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/snapshots/74dff07f4ff96e2dc7cea2420389515e6ccbb49f2dd0115ecfa38e4e55cd666d/allow-spend-expirations"

echo "Currency Address-Specific Endpoints"
curl -X GET "http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/addresses/DAG04Qob76gZG7D5qZu9oeZvr8WFxs53Md383q4x/allow-spends"
curl -X GET "http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/addresses/DAG04Qob76gZG7D5qZu9oeZvr8WFxs53Md383q4x/spend-transactions"
curl -X GET "http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/addresses/DAG04Qob76gZG7D5qZu9oeZvr8WFxs53Md383q4x/allow-spend-expirations"
