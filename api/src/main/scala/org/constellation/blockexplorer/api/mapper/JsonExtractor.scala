package org.constellation.blockexplorer.api.mapper

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.parser.parse
import io.circe.{Decoder, Encoder, Json}
import org.constellation.blockexplorer.api.controller.TransactionController
import org.constellation.blockexplorer.schema._

import scala.util.Try

class JsonExtractor {

  implicit val snapshotDecoder: Decoder[Snapshot] = deriveDecoder
  implicit val checkpointDecoder: Decoder[CheckpointBlock] = deriveDecoder
  implicit val heightDecoder: Decoder[Height] = deriveDecoder
  implicit val transactionDecoder: Decoder[Transaction] = deriveDecoder
  implicit val transactionEdgeDataDecoder: Decoder[TransactionEdgeData] = deriveDecoder
  implicit val typedEdgeHashDecoder: Decoder[TypedEdgeHash] = deriveDecoder
  implicit val observationEdgeDecoder: Decoder[ObservationEdge] = deriveDecoder
  implicit val idDecoder: Decoder[Id] = deriveDecoder
  implicit val hashSignatureDecoder: Decoder[HashSignature] = deriveDecoder
  implicit val signatureBatchDecoder: Decoder[SignatureBatch] = deriveDecoder
  implicit val signedObservationEdgeDecoder: Decoder[SignedObservationEdge] = deriveDecoder
  implicit val transactionEdgeDecoder: Decoder[TransactionEdge] = deriveDecoder
  implicit val transactionOriginalDecoder: Decoder[TransactionOriginal] = deriveDecoder
  implicit val lastTransactionRefDecoder: Decoder[LastTransactionRef] = deriveDecoder

  def mapTransactionJson(json: Json): Json = {
    val mapped = json.hcursor
      .downField("transactionOriginal")
      .downField("edge")
      .downField("observationEdge")
      .downField("parents")
      .downArray
      .withFocus({ a =>
        a.mapObject(obj => {
          val m = obj.toMap
          obj.add("hashReference", m.getOrElse("hash", Json.fromString(""))).remove("hash")
        })
      })
      .right
      .withFocus({ a =>
        a.mapObject(obj => {
          val m = obj.toMap
          obj.add("hashReference", m.getOrElse("hash", Json.fromString(""))).remove("hash")
        })
      })
      .up
      .up
      .downField("data")
      .withFocus({ a =>
        a.mapObject(obj => {
          val m = obj.toMap
          obj.add("hashReference", m.getOrElse("hash", Json.fromString(""))).remove("hash")
        })
      })

    mapped.top.get
  }

  def extractTransactionsEsResult(doc: String): Option[Seq[Transaction]] =
    Try(extractTransactions(doc)).toOption

  def extractCheckpointBlockEsResult(doc: String): Option[Seq[CheckpointBlock]] =
    Try(extractCheckpointBlock(doc)).toOption

  def extractSnapshotEsResult(doc: String): Option[Seq[Snapshot]] =
    Try(extractSnapshot(doc)).toOption

  private def extractTransactions(doc: String): Seq[Transaction] = {
    val hits: Iterable[Json] = parse(doc).right.get.hcursor.downField("hits").downField("hits").values.get

    hits
      .map(
        a => mapTransactionJson(a.hcursor.downField("_source").focus.get).as[Transaction].right.get
      )
      .toSeq
  }

  private def extractSnapshot(doc: String): Seq[Snapshot] = {
    val hits: Iterable[Json] = parse(doc).right.get.hcursor.downField("hits").downField("hits").values.get

    hits.map(_.hcursor.downField("_source").as[Snapshot].right.get).toSeq
  }

  private def extractCheckpointBlock(doc: String): Seq[CheckpointBlock] = {
    val hits: Iterable[Json] = parse(doc).right.get.hcursor.downField("hits").downField("hits").values.get

    hits.map(_.hcursor.downField("_source").as[CheckpointBlock].right.get).toSeq
  }

}
