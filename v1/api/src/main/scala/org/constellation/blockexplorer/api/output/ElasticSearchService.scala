package org.constellation.blockexplorer.api.output

import com.sksamuel.elastic4s.ElasticDsl.{search, termQuery, _}
import com.sksamuel.elastic4s.http.JavaClient
import com.sksamuel.elastic4s.requests.searches.{SearchRequest, SearchResponse}
import com.sksamuel.elastic4s.{ElasticClient, ElasticProperties, RequestSuccess, Response}
import io.circe.parser.parse
import org.constellation.blockexplorer.config.ConfigLoader

class ElasticSearchService(configLoader: ConfigLoader) {

  private val client = ElasticClient(
    JavaClient(ElasticProperties(s"http://${configLoader.elasticsearchUrl}:${configLoader.elasticsearchPort}"))
  )
  private val clientV2 = ElasticClient(
    JavaClient(ElasticProperties(s"http://${configLoader.elasticsearchUrlV2}:${configLoader.elasticsearchPort}"))
  )

  def findTransaction(id: String): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchTransactionsIndex).query(termQuery("hash", id)).size(-1)
    }

  def findSnapshot(id: String): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchSnapshotsIndex).query(termQuery("hash", id)).size(-1)
    }

  def findHighestSnapshot(): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchSnapshotsIndex).query(matchAllQuery()).sortByFieldDesc("height").size(1)
    }

  def findSnapshotByHeight(height: Long): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchSnapshotsIndex).query(termQuery("height", height)).size(-1)
    }

  def findCheckpointBlock(id: String): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchCheckpointBlocksIndex).query(termQuery("hash", id)).size(-1)
    }

  def findCheckpointBlockBySoe(id: String): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchCheckpointBlocksIndex).query(termQuery("soeHash", id)).size(-1)
    }

  def findTransactionForSender(address: String): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchTransactionsIndex)
        .query(matchQuery("sender", address))
        .size(10000)
        .sortByFieldDesc("lastTransactionRef.ordinal")
    }

  def findTransactionForReceiver(address: String): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchTransactionsIndex)
        .query(matchQuery("receiver", address))
        .size(10000)
        .sortByFieldDesc("lastTransactionRef.ordinal")
    }

  def findTransactionForAddress(address: String): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchTransactionsIndex)
        .query(multiMatchQuery(address))
        .size(10000)
        .sortByFieldDesc("lastTransactionRef.ordinal")
    }

  def findTransactionForSnapshotHash(hash: String): Response[SearchResponse] =
    executeWithFallback {
      search(configLoader.elasticsearchTransactionsIndex)
        .query(matchQuery("snapshotHash", hash))
        .size(10000)
        .sortByFieldDesc("lastTransactionRef.ordinal")
    }

  private def executeWithFallback(searchRequest: SearchRequest): Response[SearchResponse] = {
    val response = client.execute(searchRequest).await

    response match {
      case RequestSuccess(status, body, headers, result) =>
        body
          .flatMap(hits)
          .filterNot(_ == 0)
          .fold(
            clientV2.execute(searchRequest).await
          )(_ => response)
      case _ => response // Delegate to Controller
    }
  }

  private def hits(doc: String): Option[Int] =
    parse(doc).right.get.hcursor.downField("hits").downField("total").downField("value").as[Int].toOption
}
