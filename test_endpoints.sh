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
curl http://localhost:3001/blocks/9641acffb4a5276d013e49676fcea51e231c5c9737b5866f8df07de04145e374 #ok

# Transactions
curl http://localhost:3001/transactions #ok 
curl http://localhost:3001/transactions/d8b1f2dec3030dd4e9b17e63871cc4bdb2ecb1f4d8bda079c75fdfac3a685c79 #ok 
curl http://localhost:3001/addresses/DAG1x6erYwDLvt3zXxZvdHaZcNVhWfFFVC1Qunjd/transactions #ok 
curl http://localhost:3001/addresses/DAG1x6erYwDLvt3zXxZvdHaZcNVhWfFFVC1Qunjd/transactions/sent #ok 
curl http://localhost:3001/addresses/DAG0WtbjHQu5LsZ57DcxX7kuA5DyyvG5QYG2uu9X/transactions/received #ok 

# Address Balance
curl http://localhost:3001/addresses/DAG4J3i4K87evc71ti3aEcSKx8AUR5GhPy3EysiM/balance #ok
 
# Currency Snapshots
curl http://localhost:3001/currency/DAG5kfY9GoHF1CYaY8tuRJxmB3JSzAEARJEAkA2C/snapshots #ok

# curl http://localhost:3001/addresses/{address}/snapshots

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
# curl http://localhost:3001/currency/{identifier}/fee-transactions/{hash}
# curl http://localhost:3001/currency/{identifier}/snapshots/{term}/fee-transactions
# curl http://localhost:3001/currency/{identifier}/addresses/{address}/fee-transactions
# curl http://localhost:3001/currency/{identifier}/addresses/{address}/fee-transactions/sent
# curl http://localhost:3001/currency/{identifier}/addresses/{address}/fee-transactions/received

# Metagraphs
curl http://localhost:3001/currency  #ok 
