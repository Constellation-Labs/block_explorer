-- Add current_token_lock_hash and current_amount fields to delegate_stake_create_events

ALTER TABLE delegate_stake_create_events
ADD COLUMN current_token_lock_hash varchar NULL,
ADD COLUMN current_amount int8 NULL;
