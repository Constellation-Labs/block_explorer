package org.constellation.blockexplorer.api.output

import com.sksamuel.elastic4s.ElasticDsl.{search, termQuery, _}
import com.sksamuel.elastic4s.http.JavaClient
import com.sksamuel.elastic4s.requests.searches.SearchResponse
import com.sksamuel.elastic4s.{ElasticClient, ElasticProperties, Response}
import org.constellation.blockexplorer.config.ConfigLoader

class ElasticSearchService(configLoader: ConfigLoader) {

  private val client = ElasticClient(
    JavaClient(ElasticProperties(s"http://${configLoader.elasticsearchUrl}:${configLoader.elasticsearchPort}"))
  )

  def findTransaction(id: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchTransactionsIndex).query(termQuery("hash", id)).size(-1)
    }.await

  def findSnapshot(id: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchSnapshotsIndex).query(termQuery("hash", id)).size(-1)
    }.await

  def findHighestSnapshot(): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchSnapshotsIndex).query(matchAllQuery()).sortByFieldDesc("height").size(1)
    }.await

  def findSnapshotByHeight(height: Long): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchSnapshotsIndex).query(termQuery("height", height)).size(-1)
    }.await

  def findCheckpointBlock(id: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchCheckpointBlocksIndex).query(termQuery("hash", id)).size(-1)
    }.await

  def findCheckpointBlockBySoe(id: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchCheckpointBlocksIndex).query(termQuery("soeHash", id)).size(-1)
    }.await

  def findTransactionForSender(address: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchTransactionsIndex)
        .query(matchQuery("sender", address))
        .size(10000)
        .sortByFieldDesc("lastTransactionRef.ordinal")
    }.await

  def findTransactionForReceiver(address: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchTransactionsIndex)
        .query(matchQuery("receiver", address))
        .size(10000)
        .sortByFieldDesc("lastTransactionRef.ordinal")
    }.await

  def findTransactionForAddress(address: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchTransactionsIndex)
        .query(multiMatchQuery(address))
        .size(10000)
        .sortByFieldDesc("lastTransactionRef.ordinal")
    }.await
}
