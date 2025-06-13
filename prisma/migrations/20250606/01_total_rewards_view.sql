CREATE VIEW delegate_stake_total_rewards_view AS
SELECT
  stake_create_hash,
  SUM(rewards) AS delegate_stake_total_rewards
FROM
  delegate_stake_rewards
GROUP BY
  stake_create_hash;


CREATE VIEW token_lock_total_rewards_view as SELECT
  lock_reference_hash, 
  sum(rewards) as total_rewards
FROM
  delegate_stake_rewards dsr, 
  delegate_stake_create_events dsce, 
  delegate_stake_withdraw_events dswe 
  where dsce.hash = dsr.stake_create_hash and dsce.hash = dswe.stake_create_hash and dswe.is_completed
GROUP BY
  lock_reference_hash;

