package org.constellation.blockexplorer.schema

case class Transaction(
  hash: String,
  amount: Long,
  fee: Long,
  isDummy: Boolean,
  lastTransactionRef: LastTransactionRef,
  snapshotHash: String,
  checkpointBlock: String
)
