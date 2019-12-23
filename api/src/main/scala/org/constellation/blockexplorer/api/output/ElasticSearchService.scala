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
      search(configLoader.elasticsearchTransactionsIndex).query(termQuery("hash", id))
    }.await

  def findSnapshot(id: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchSnapshotsIndex).query(termQuery("hash", id))
    }.await

  def findCheckpointBlock(id: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchCheckpointBlocksIndex).query(termQuery("hash", id))
    }.await

  def findTransactionForAddress(addres: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchTransactionsIndex).query(termQuery("sender", addres))
    }.await
}