package org.constellation.blockexplorer.handler.mapper

import io.circe.generic.semiauto.deriveEncoder
import io.circe.syntax._
import io.circe.{Encoder, Json}
import org.constellation.blockexplorer.schema._

class SnapshotJsonMapper {

  implicit val snapshotEncoder: Encoder[Snapshot] = deriveEncoder[Snapshot]
  implicit val checkpointEncoder: Encoder[CheckpointBlock] = deriveEncoder[CheckpointBlock]
  implicit val heightEncoder: Encoder[Height] = deriveEncoder[Height]
  implicit val transactionEncoder: Encoder[Transaction] = deriveEncoder[Transaction]
  implicit val lastTransactionRefEncoder: Encoder[LastTransactionRef] = deriveEncoder[LastTransactionRef]

  def mapSnapshotToJson(snapshot: Snapshot): Json =
    snapshot.asJson

  def mapCheckpointBlockToJson(checkpointBlock: CheckpointBlock): Json =
    checkpointBlock.asJson

  def mapTransactionToJson(transaction: Transaction): Json =
    transaction.asJson
}
