package org.constellation.blockexplorer.api.mapper

import io.circe.generic.semiauto.deriveEncoder
import io.circe.syntax._
import io.circe.{Encoder, Json}
import org.constellation.blockexplorer.schema._

import scala.util.Try

class JsonEncoder {

  implicit val snapshotEncoder: Encoder[Snapshot] = deriveEncoder[Snapshot]
  implicit val checkpointEncoder: Encoder[CheckpointBlock] = deriveEncoder[CheckpointBlock]
  implicit val heightEncoder: Encoder[Height] = deriveEncoder[Height]
  implicit val transactionEncoder: Encoder[Transaction] = deriveEncoder[Transaction]
  implicit val lastTransactionRefEncoder: Encoder[LastTransactionRef] = deriveEncoder[LastTransactionRef]

  def transactionToJson(transaction: Transaction): Either[Throwable, Json] =
    Try(transaction.asJson).toEither

  def transactionsToJson(transactions: Seq[Transaction]): Option[Json] =
    Try(transactions.asJson).toOption

  def checkpointToJson(checkpointBlock: CheckpointBlock): Either[Throwable, Json] =
    Try(checkpointBlock.asJson).toEither

  def snapshotToJson(snapshot: Snapshot): Either[Throwable, Json] =
    Try(snapshot.asJson).toEither
}
