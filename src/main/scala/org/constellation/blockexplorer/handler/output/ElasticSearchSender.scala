package org.constellation.blockexplorer.handler.output

import org.constellation.blockexplorer.config.ConfigLoader
import org.constellation.blockexplorer.handler.mapper.{SnapshotJsonMapper, StoredSnapshotMapper}
import org.constellation.blockexplorer.schema.{CheckpointBlock, Snapshot, Transaction}
import org.constellation.consensus.StoredSnapshot
import org.slf4j.{Logger, LoggerFactory}
import sttp.client._

class ElasticSearchSender(
  configLoader: ConfigLoader,
  snapshotJsonMapper: SnapshotJsonMapper,
  storedSnapshotMapper: StoredSnapshotMapper
) {

  implicit val backend: SttpBackend[Identity, Nothing, NothingT] = HttpURLConnectionBackend()

  val logger: Logger = LoggerFactory.getLogger(getClass)

  def mapAndSendToElasticSearch(storedSnapshot: StoredSnapshot): Unit = {
    val snapshotResponse = Seq(storedSnapshotMapper.mapSnapshot(storedSnapshot))
      .map(s => sendSnapshot(s.hash, s))
    logger.info(s"ES Response Success : ${snapshotResponse.count(_.isSuccess)}")

    val checkpointBlocksResponse = storedSnapshotMapper
      .mapCheckpointBlock(storedSnapshot)
      .map(c => sendCheckpointBlock(c.hash, c))
    logger.info(s"ES Response Success Count : ${checkpointBlocksResponse.count(_.isSuccess)}")

    val transactionsResponse = storedSnapshotMapper
      .mapTransaction(storedSnapshot)
      .map(t => sendTransaction(t.hash, t))
    logger.info(s"ES Response Success Count : ${transactionsResponse.count(_.isSuccess)}")

    logErrorsIfExists(transactionsResponse ++ checkpointBlocksResponse ++ snapshotResponse)
  }

  private def logErrorsIfExists(responses: Seq[Identity[Response[Either[String, String]]]]): Unit =
    responses.filterNot(_.isSuccess).foreach(response => logger.error(s"Error : $response"))

  private def sendSnapshot(id: String, snapshot: Snapshot) =
    sendToElasticSearch(
      id,
      configLoader.elasticsearchSnapshotsIndex,
      snapshotJsonMapper.mapSnapshotToJson(snapshot).toString()
    )

  private def sendCheckpointBlock(id: String, checkpointBlock: CheckpointBlock) =
    sendToElasticSearch(
      id,
      configLoader.elasticsearchCheckpointBlocksIndex,
      snapshotJsonMapper.mapCheckpointBlockToJson(checkpointBlock).toString()
    )

  private def sendTransaction(id: String, transaction: Transaction) =
    sendToElasticSearch(
      id,
      configLoader.elasticsearchTransactionsIndex,
      snapshotJsonMapper.mapTransactionToJson(transaction).toString()
    )

  private def sendToElasticSearch(id: String, index: String, objectToSend: String) =
    basicRequest
      .put(uri"${configLoader.elasticsearchUrl}/$index/_doc/$id?op_type=index")
      .body(objectToSend)
      .contentType("application/json")
      .send()
}
