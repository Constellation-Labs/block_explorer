package org.constellation.blockexplorer.schema

case class LastTransactionRef(
  prevHash: String,
  ordinal: Long
)
