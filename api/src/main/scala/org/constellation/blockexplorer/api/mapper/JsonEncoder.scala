package org.constellation.blockexplorer.api.mapper

import io.circe.syntax._
import io.circe.{Encoder, Json}
import io.circe.generic.semiauto.deriveEncoder
import org.constellation.blockexplorer.schema.{CheckpointBlock, Height, LastTransactionRef, Snapshot, Transaction}

import scala.util.Try

class JsonEncoder {

  implicit val snapshotEncoder: Encoder[Snapshot] = deriveEncoder[Snapshot]
  implicit val checkpointEncoder: Encoder[CheckpointBlock] = deriveEncoder[CheckpointBlock]
  implicit val heightEncoder: Encoder[Height] = deriveEncoder[Height]
  implicit val transactionEncoder: Encoder[Transaction] = deriveEncoder[Transaction]
  implicit val lastTransactionRefEncoder: Encoder[LastTransactionRef] = deriveEncoder[LastTransactionRef]

  def transactionToJson(transaction: Transaction): Either[Throwable, Json] =
    Try(transaction.asJson).toEither
}
