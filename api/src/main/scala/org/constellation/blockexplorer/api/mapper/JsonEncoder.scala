package org.constellation.blockexplorer.api.mapper

import io.circe.generic.semiauto.deriveEncoder
import io.circe.syntax._
import io.circe.{Encoder, Json}
import org.constellation.blockexplorer.schema._

import scala.util.Try

class JsonEncoder {

  implicit val snapshotEncoder: Encoder[Snapshot] = deriveEncoder
  implicit val checkpointEncoder: Encoder[CheckpointBlock] = deriveEncoder
  implicit val heightEncoder: Encoder[Height] = deriveEncoder
  implicit val transactionEncoder: Encoder[Transaction] = deriveEncoder
  implicit val transactionEdgeDataEncoder: Encoder[TransactionEdgeData] = deriveEncoder
  implicit val typedEdgeHashEncoder: Encoder[TypedEdgeHash] = deriveEncoder
  implicit val observationEdgeEncoder: Encoder[ObservationEdge] = deriveEncoder
  implicit val idEncoder: Encoder[Id] = deriveEncoder
  implicit val hashSignatureEncoder: Encoder[HashSignature] = deriveEncoder
  implicit val signatureBatchEncoder: Encoder[SignatureBatch] = deriveEncoder
  implicit val signedObservationEdgeEncoder: Encoder[SignedObservationEdge] = deriveEncoder
  implicit val transactionEdgeEncoder: Encoder[TransactionEdge] = deriveEncoder
  implicit val transactionOriginalEncoder: Encoder[TransactionOriginal] = deriveEncoder
  implicit val lastTransactionRefEncoder: Encoder[LastTransactionRef] = deriveEncoder

  def transactionToJson(transaction: Transaction): Either[Throwable, Json] =
    Try(transaction.asJson).toEither

  def transactionsToJson(transactions: Seq[Transaction]): Option[Json] =
    Try(transactions.asJson).toOption

  def checkpointToJson(checkpointBlock: CheckpointBlock): Either[Throwable, Json] =
    Try(checkpointBlock.asJson).toEither

  def snapshotToJson(snapshot: Snapshot): Either[Throwable, Json] =
    Try(snapshot.asJson).toEither
}
