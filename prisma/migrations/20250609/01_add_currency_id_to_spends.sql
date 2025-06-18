ALTER TABLE dag_allow_spends ADD currency_id varchar NULL;
ALTER TABLE dag_allow_spends ADD CONSTRAINT dag_allow_spends_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;

ALTER TABLE dag_spend_transactions ADD currency_id varchar NULL;
ALTER TABLE dag_spend_transactions ADD CONSTRAINT dag_spend_transactions_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;

ALTER TABLE dag_expired_spend_transactions ADD currency_id varchar NULL;
ALTER TABLE dag_expired_spend_transactions ADD CONSTRAINT dag_expired_spend_transactions_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;

ALTER TABLE metagraph_allow_spends ADD currency_id varchar NULL;
ALTER TABLE metagraph_allow_spends ADD CONSTRAINT metagraph_allow_spends_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;

ALTER TABLE metagraph_spend_transactions ADD currency_id varchar NULL;
ALTER TABLE metagraph_spend_transactions ADD CONSTRAINT metagraph_spend_transactions_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;

ALTER TABLE metagraph_expired_spend_transactions ADD currency_id varchar NULL;
ALTER TABLE metagraph_expired_spend_transactions ADD CONSTRAINT metagraph_expired_spend_transactions_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;



ALTER TABLE dag_token_locks ADD currency_id varchar NULL;
ALTER TABLE dag_token_locks ADD CONSTRAINT dag_token_locks_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;

ALTER TABLE dag_token_unlocks ADD currency_id varchar NULL;
ALTER TABLE dag_token_unlocks ADD CONSTRAINT dag_token_unlocks_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;

ALTER TABLE metagraph_token_locks ADD currency_id varchar NULL;
ALTER TABLE metagraph_token_locks ADD CONSTRAINT metagraph_token_locks_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;

ALTER TABLE metagraph_token_unlocks ADD currency_id varchar NULL;
ALTER TABLE metagraph_token_unlocks ADD CONSTRAINT metagraph_token_unlocks_metagraphs_fk FOREIGN KEY (currency_id) REFERENCES public.metagraphs(id) ON DELETE CASCADE;
