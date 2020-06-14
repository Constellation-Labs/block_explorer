package org.constellation.blockexplorer.handler.mapper

import io.circe.generic.semiauto.deriveEncoder
import io.circe.syntax._
import io.circe.{Encoder, Json}
import org.constellation.blockexplorer.schema._

class SnapshotJsonMapper {

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

  def mapSnapshotToJson(snapshot: Snapshot): Json =
    snapshot.asJson

  def mapCheckpointBlockToJson(checkpointBlock: CheckpointBlock): Json =
    checkpointBlock.asJson

  def mapTransactionToJson(transaction: Transaction): Json =
    transaction.asJson.deepDropNullValues
}
