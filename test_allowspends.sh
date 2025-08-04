#!/bin/bash

BASE_URL="http://localhost:3001"

echo "General Allow-Spend Endpoints"
curl -X GET "http://localhost:3001/allow-spends"
curl -X GET "http://localhost:3001/spend-transactions"
curl -X GET "http://localhost:3001/allow-spend-expirations"

echo "Global Snapshot Endpoints"
curl -X GET "http://localhost:3001/global-snapshots/80f93d4ef86dd1bf69648b5070e27d545d23ae578925198cc45dc17e02128312/allow-spends"
curl -X GET "http://localhost:3001/global-snapshots/618a6f6bedba2c8a84ca3513f1cf0f6fe9eafb6f7872eecf2e222216351708b6/spend-transactions"
curl -X GET "http://localhost:3001/global-snapshots/672c3eb45ff5527a773b02f7722de762d0232d0f347cb1871ffa7226d9fdb18a/allow-spend-expirations"

echo "Address-Specific Endpoints"
curl -X GET "http://localhost:3001/addresses/DAG77zerQ2BUVhtVgkmseihkEfLXieBBm57vqA4J/allow-spends"
curl -X GET "http://localhost:3001/addresses/DAG77zerQ2BUVhtVgkmseihkEfLXieBBm57vqA4J/spend-transactions"
curl -X GET "http://localhost:3001/addresses/DAG77zerQ2BUVhtVgkmseihkEfLXieBBm57vqA4J/allow-spend-expirations"

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

echo "Spends by hash" 
curl http://localhost:3001/allow-spends/tx003
curl http://localhost:3001/spend-transactions/tx005
curl http://localhost:3001/allow-spend-expirations/AlLoWsPeNdExPiRaTiOnHaSh123

echo "Metagraph spends by hash" 
curl http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/allow-spends/tx003mg
curl http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/spend-transactions/tx005mg
curl http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/allow-spend-expirations/AlLoWsPeNdExPiRaTiOnHaSh123
