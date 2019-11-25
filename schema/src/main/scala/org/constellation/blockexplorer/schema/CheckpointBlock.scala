package org.constellation.blockexplorer.schema

case class CheckpointBlock(
  hash: String,
  height: Height,
  transactions: Seq[String],
  notifications: Seq[String],
  observations: Seq[String],
  children: Long,
  snapshotHash: String
)
