package org.constellation.blockexplorer.handler.mapper

import com.amazonaws.services.sqs.model.Message
import io.circe.Json
import io.circe.parser.parse

import scala.util.Try

class SQSMessageJsonExtractor {

  def extractMessage(message: Message): Try[List[(String, String)]] = Try {
    val json = parse(message.getBody).right.get
    val jsonRecords = json.hcursor.downField("Records").values.get

    jsonRecords
      .map(record => (extractBucketName(record), extractObjectKey(record)))
      .toList
  }

  private def extractBucketName(record: Json): String =
    record.hcursor
      .downField("s3")
      .downField("bucket")
      .downField("name")
      .as[String]
      .right
      .get

  private def extractObjectKey(record: Json): String =
    record.hcursor
      .downField("s3")
      .downField("object")
      .downField("key")
      .as[String]
      .right
      .get
}
