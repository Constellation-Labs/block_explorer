delete from only abstract_transactions;
delete from only abstract_blocks; 

DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_dag_allow_spends" ON "dag_allow_spends";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_blocks_dag" ON "dag_blocks";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_dag_spend_transactions" ON "dag_spend_transactions";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_dag_expired_spend_transact" ON "dag_expired_spend_transactions";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_dag_token_locks" ON "dag_token_locks";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_dag_token_unlocks" ON "dag_token_unlocks";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_metagraph_token_locks" ON "metagraph_token_locks";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_metagraph_token_unlocks" ON "metagraph_token_unlocks";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_metagraph_allow_spends" ON "metagraph_allow_spends";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_blocks_metagraph" ON "metagraph_blocks";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_metagraph_fee_transactions" ON "metagraph_fee_transactions";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_metagraph_spend_transactio" ON "metagraph_spend_transactions";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_metagraph_expired_spend_tr" ON "metagraph_expired_spend_transactions";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_dag_transactions" ON "dag_transactions";
DROP TRIGGER IF EXISTS "trigger_insert_abstract_transactions_metagraph_transactions" ON "metagraph_transactions";