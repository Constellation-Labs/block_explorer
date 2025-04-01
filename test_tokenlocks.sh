#!/bin/bash

BASE_URL="http://localhost:3001"  # Change if needed

echo "Testing tokenLocks endpoint..."
curl http://localhost:3001/token-locks -H "Content-Type: application/json"
echo -e "\n"

echo "Testing globalSnapshotTokenLocks endpoint..."
curl http://localhost:3001/global-snapshots/c3071648a319313afdecad217f196558a7893dde2bc78ee56fbb0d0a5b73700b/token-locks -H "Content-Type: application/json"
echo -e "\n"

echo "Testing addressTokenLocks endpoint..."
curl http://localhost:3001/addresses/DAG5sz69nNwGF8ypn1yukFpg2pVJpdx5mnf1PJVc/token-locks -H "Content-Type: application/json"
echo -e "\n"

echo "Testing tokenUnlocks endpoint..."
curl http://localhost:3001/token-unlocks -H"Content-Type: application/json"
echo -e "\n"

echo "Testing globalSnapshotTokenUnlocks endpoint..."
curl http://localhost:3001/global-snapshots/3cdde2bc02d9ad3da07fe52686a51db448129d9adf3167747be77e31f951c428/token-unlocks -H"Content-Type: application/json"
echo -e "\n"

echo "Testing addressTokenUnlocks endpoint..."
curl http://localhost:3001/addresses/DAG4AqNNL2E7TWBUvQRxSPhraS2Lnr5xPM6xtVbs/token-unlocks -H"Content-Type: application/json"
echo -e "\n"

echo "Testing currencyTokenLocks endpoint..."
curl http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/token-locks -H"Content-Type: application/json"
echo -e "\n"

echo "Testing currencySnapshotTokenLocks endpoint..."
curl http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/snapshots/74dff07f4ff96e2dc7cea2420389515e6ccbb49f2dd0115ecfa38e4e55cd666d/token-locks -H"Content-Type: application/json"
echo -e "\n"

echo "Testing currencyAddressTokenLocks endpoint..."
curl http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/addresses/DAG5T61H6RNLR4wLueNNZo8JR7fDKuGQSZoGTVki/token-locks -H"Content-Type: application/json"
echo -e "\n"

echo "Testing currencySnapshotTokenUnlocks endpoint..."
curl http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/snapshots/74dff07f4ff96e2dc7cea2420389515e6ccbb49f2dd0115ecfa38e4e55cd666d/token-unlocks -H"Content-Type: application/json"
echo -e "\n"

echo "Testing currencyTokenUnlocks endpoint..."
curl http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/token-unlocks -H"Content-Type: application/json"
echo -e "\n"

echo "Testing currencyAddressTokenUnlocks endpoint..."
curl http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/addresses/DAG4AqNNL2E7TWBUvQRxSPhraS2Lnr5xPM6xtVbs/token-unlocks -H"Content-Type: application/json"
echo -e "\n"

echo "All tests completed."
