package org.constellation.blockexplorer.schema

case class Transaction(
  hash: String,
  amount: Long,
  receiver: String,
  sender: String,
  fee: Long,
  isDummy: Boolean,
  lastTransactionRef: LastTransactionRef,
  snapshotHash: String,
  checkpointBlock: String
)
