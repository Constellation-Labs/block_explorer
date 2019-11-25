package org.constellation.blockexplorer.schema

case class Snapshot(
  hash: String,
  checkpointBlocks: Seq[String]
)
