package org.constellation.blockexplorer.handler

import org.constellation.blockexplorer.config.ConfigLoader
import org.constellation.blockexplorer.handler.input.{S3Handler, SQSHandler}
import org.constellation.blockexplorer.handler.mapper.{
  SQSMessageJsonExtractor,
  SnapshotJsonMapper,
  StoredSnapshotMapper
}
import org.constellation.blockexplorer.handler.output.ElasticSearchSender
import org.constellation.blockexplorer.handler.serializer.{KryoSerializer, Serializer}
import org.slf4j.{Logger, LoggerFactory}

object RequestHandler {

  val logger: Logger = LoggerFactory.getLogger(getClass)

  def main(args: Array[String]): Unit = {
    logger.info("Request Handler : Init started")
    val configLoader: ConfigLoader = new ConfigLoader
    val serializer: Serializer = new KryoSerializer
    val sqsMessageJsonExtractor: SQSMessageJsonExtractor = new SQSMessageJsonExtractor
    val snapshotJsonMapper: SnapshotJsonMapper = new SnapshotJsonMapper
    val storedSnapshotMapper: StoredSnapshotMapper = new StoredSnapshotMapper

    val sqsHandler: SQSHandler = new SQSHandler(configLoader, sqsMessageJsonExtractor)
    val s3Handler: S3Handler = new S3Handler(serializer)
    val esSender: ElasticSearchSender = new ElasticSearchSender(configLoader, snapshotJsonMapper, storedSnapshotMapper)
    logger.info("Request Handler : Init finished")

    while (true) {
      try {
        logger.info("Try to receive new snapshots")

        val received: List[(String, String)] = sqsHandler.receiveNewSnapshots()
        logger.info(s"Received snapshot SQS : ${received.size}")

        val downloaded = s3Handler.getSnapshots(received)
        logger.info(s"Downloaded snapshot : ${downloaded.size}")

        downloaded.foreach(storedSnapshot => esSender.mapAndSendToElasticSearch(storedSnapshot))
        logger.info(s"Sending finished")
      } catch {
        case e: Throwable => logger.error(e.getMessage)
      }
    }
  }

}
