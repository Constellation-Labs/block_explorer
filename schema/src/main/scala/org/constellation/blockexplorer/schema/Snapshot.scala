package org.constellation.blockexplorer.schema

case class Snapshot(
  hash: String,
  height: Long,
  checkpointBlocks: Seq[String]
)
