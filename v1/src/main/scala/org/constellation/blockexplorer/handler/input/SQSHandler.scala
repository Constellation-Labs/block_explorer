package org.constellation.blockexplorer.handler.input

import com.amazonaws.services.sqs.model.{DeleteMessageRequest, DeleteMessageResult, Message, ReceiveMessageRequest}
import com.amazonaws.services.sqs.{AmazonSQS, AmazonSQSClientBuilder}
import org.constellation.blockexplorer.config.ConfigLoader
import org.constellation.blockexplorer.handler.mapper.SQSMessageJsonExtractor

import scala.collection.JavaConverters._

class SQSHandler(configLoader: ConfigLoader, messageJsonExtractor: SQSMessageJsonExtractor) {

  private val SQSClient: AmazonSQS =
    AmazonSQSClientBuilder.defaultClient()

  def receiveNewSnapshots(): List[(String, String)] =
    receiveMessage()
      .flatMap(message => messageJsonExtractor.extractMessage(message).toOption)
      .flatten

  private def receiveMessage(): List[Message] = {
    val receivedMessages: List[Message] =
      SQSClient
        .receiveMessage(
          new ReceiveMessageRequest(configLoader.sqsUrl)
            .withWaitTimeSeconds(10)
            .withMaxNumberOfMessages(10)
        )
        .getMessages
        .asScala
        .toList

    receivedMessages.foreach(m => deleteMessage(m))
    receivedMessages
  }

  private def deleteMessage(message: Message): DeleteMessageResult =
    SQSClient.deleteMessage(new DeleteMessageRequest(configLoader.sqsUrl, message.getReceiptHandle))
}
