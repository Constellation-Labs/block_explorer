package org.constellation.blockexplorer.api.mapper

import io.circe.{Decoder, Json}
import io.circe.generic.semiauto.deriveDecoder
import io.circe.parser.parse
import org.constellation.blockexplorer.schema.{CheckpointBlock, Height, LastTransactionRef, Snapshot, Transaction}

import scala.util.Try

class JsonExtractor {

  implicit val snapshotDecoder: Decoder[Snapshot] = deriveDecoder[Snapshot]
  implicit val checkpointDecoder: Decoder[CheckpointBlock] = deriveDecoder[CheckpointBlock]
  implicit val heightDecoder: Decoder[Height] = deriveDecoder[Height]
  implicit val transactionDecoder: Decoder[Transaction] = deriveDecoder[Transaction]
  implicit val lastTransactionRefDecoder: Decoder[LastTransactionRef] = deriveDecoder[LastTransactionRef]

  def extractTransactionsEsResult(doc: String): Option[Seq[Transaction]] =
    Try(extractTransactions(doc)).toOption

  private def extractTransactions(doc: String): Seq[Transaction] = {
    val json: Json = parse(doc).right.get
    val hits: Iterable[Json] = json.hcursor.downField("hits").downField("hits").values.get

    hits.map(_.hcursor.downField("_source").as[Transaction].right.get).toSeq
  }
}
