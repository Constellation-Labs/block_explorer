#!/bin/bash

# Global Snapshots
curl http://localhost:3001/global-snapshots  #ok 
curl http://localhost:3001/global-snapshots/695097c844c520c40577f168b85b994558024b44fd64c245154625c89fda024f  #ok 
curl http://localhost:3001/global-snapshots/155849  #ok 
curl http://localhost:3001/global-snapshots/latest 

curl http://localhost:3001/global-snapshots/155849/rewards #ok 
curl http://localhost:3001/global-snapshots/695097c844c520c40577f168b85b994558024b44fd64c245154625c89fda024f/rewards #ok 
curl http://localhost:3001/global-snapshots/latest/rewards # ok 

curl http://localhost:3001/global-snapshots/390792/transactions #ok
curl http://localhost:3001/global-snapshots/latest/transactions # ok

# Blocks
curl http://localhost:3001/blocks/848ac19da2eb07f9dab32e7948c00b618a518157c8e6e1f12ade249a9928e026 #ok

# Transactions
curl http://localhost:3001/transactions #ok 
curl http://localhost:3001/transactions/09d1c22b0cf46c50ab8dd171c0a9ba4452f9d4355045f332eb424cd3ca5c821a #ok 
curl http://localhost:3001/addresses/DAG56BtU1j5uCMb5f1QxZ5oxfBhpUeYucRGygfEa/transactions #ok 
curl http://localhost:3001/addresses/DAG56BtU1j5uCMb5f1QxZ5oxfBhpUeYucRGygfEa/transactions/sent #ok 
curl http://localhost:3001/addresses/DAG45ZLcgmQeRHY3oV2ZJACrFUjEZwqeXKSfZc75/transactions/received #ok 

# Address Balance
curl http://localhost:3001/addresses/DAG8rB813m3yq8CQX92rgtc7ThBNHFngctr3uonG/balance #ok
 
# Currency Snapshots
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots #ok

curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots/1c0b793cd83af5d761d71b887f068b078daf2bdab2f7f9e5fedf09c8f63dd6b8 #ok 
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots/22 #ok 

curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots/b2bd7c8ad9f2625895f7a89ca67072ed13cb5df300e0c2343ee48b6668490fa6/rewards #ok 
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots/3098/rewards #ok 
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots/latest/rewards # ok

curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots/f960a3b8e55277afc7db968a210d66b8827d84ebf2d7ec9dfcda8389141c45eb/transactions #ok 
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots/41589/transactions #ok 
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots/latest/transactions # ok 
  
# Currency Blocks
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/blocks/1383f4cdfb1d95f2585f0a0a459ae025020a726a500d920fc8cf35b8a4aeec02  #ok

# Currency Transactions
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/transactions
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/transactions/0ab3b933e40e2c7619a29ddc7e4c266888a5ad1f2259a7aacbb1478986404cc2 #ok 
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/addresses/DAG7SWAF9DoD9rJ7Qqy3gNjefVfGw7HZZkwC4a4N/transactions #ok 
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/addresses/DAG7SWAF9DoD9rJ7Qqy3gNjefVfGw7HZZkwC4a4N/transactions/sent #ok 
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/addresses/DAG2fMnbEmsWhgYGhvdREVELyESKUqGNTEWf4B61/transactions/received #ok 

# Currency Balances
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/addresses/DAG2fMnbEmsWhgYGhvdREVELyESKUqGNTEWf4B61/balance    #ok 

# Currency Fee Transactions
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/fee-transactions/MTGRPHFEEtXId00001
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots/74dff07f4ff96e2dc7cea2420389515e6ccbb49f2dd0115ecfa38e4e55cd666d/fee-transactions
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/addresses/DAG5T61H6RNLR4wLueNNZo8JR7fDKuGQSZoGTVki/fee-transactions
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/addresses/DAG6foKfPYqKMEyLccPi9jJEZNw2RsUFWEHB4NrA/fee-transactions
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/addresses/DAG5T61H6RNLR4wLueNNZo8JR7fDKuGQSZoGTVki/fee-transactions/sent
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/addresses/DAG6foKfPYqKMEyLccPi9jJEZNw2RsUFWEHB4NrA/fee-transactions/received

# Metagraphs
curl http://localhost:3001/currency  #ok 
