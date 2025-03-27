# Get all actions
curl  http://localhost:3001/actions  #OK
echo -e "\n"
# Get global snapshot actions for a specific term
curl  http://localhost:3001/global-snapshots/618a6f6bedba2c8a84ca3513f1cf0f6fe9eafb6f7872eecf2e222216351708b6/actions
#OK
echo -e "\n"
# Get address actions for a specific address
curl  http://localhost:3001/addresses/DAG04Qob76gZG7D5qZu9oeZvr8WFxs53Md383q4x/actions #OK
echo -e "\n"
# Get currency actions for a specific metagraph ID
curl  http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/actions #OK
echo -e "\n"
# Get currency snapshot actions for a specific metagraph ID and term
curl  http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/snapshots/74dff07f4ff96e2dc7cea2420389515e6ccbb49f2dd0115ecfa38e4e55cd666d/actions
#OK
echo -e "\n"
# Get currency address actions for a specific metagraph ID and address
curl  http://localhost:3001/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/addresses/DAG5T61H6RNLR4wLueNNZo8JR7fDKuGQSZoGTVki/actions
#OK


# # Get all actions
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/actions  #OK
# echo -e "\n"
# # Get global snapshot actions for a specific term
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/global-snapshots/0f6a37bc3b1bcd2a751af4bf384db052cef46048c4322baa303f22eda053fbc4/actions
# #OK
# echo -e "\n"
# # Get address actions for a specific address
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/addresses/DAG04Qob76gZG7D5qZu9oeZvr8WFxs53Md383q4x/actions #OK
# echo -e "\n"
# # Get currency actions for a specific metagraph ID
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/actions #OK
# echo -e "\n"
# # Get currency snapshot actions for a specific metagraph ID and term
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/snapshots/74dff07f4ff96e2dc7cea2420389515e6ccbb49f2dd0115ecfa38e4e55cd666d/actions
# #OK
# echo -e "\n"
# # Get currency address actions for a specific metagraph ID and address
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/addresses/DAG5T61H6RNLR4wLueNNZo8JR7fDKuGQSZoGTVki/actions
# #OK
# echo -e "\n"



# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/actions | jq 
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/global-snapshots/3cdde2bc02d9ad3da07fe52686a51db448129d9adf3167747be77e31f951c428/actions | jq
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/global-snapshots/618a6f6bedba2c8a84ca3513f1cf0f6fe9eafb6f7872eecf2e222216351708b6/actions | jq
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/addresses/DAG04Qob76gZG7D5qZu9oeZvr8WFxs53Md383q4x/actions | jq
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/actions  | jq
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/snapshots/74dff07f4ff96e2dc7cea2420389515e6ccbb49f2dd0115ecfa38e4e55cd666d/actions  | jq
# curl  https://8kiu9tfle8.execute-api.us-west-1.amazonaws.com/currency/DAG5ySNMCXFLRmmXdTLwKPhV8YhBB8AFU88TxSbP/addresses/DAG5T61H6RNLR4wLueNNZo8JR7fDKuGQSZoGTVki/actions | jq
