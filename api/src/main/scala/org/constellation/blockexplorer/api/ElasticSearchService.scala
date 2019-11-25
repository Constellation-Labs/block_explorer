package org.constellation.blockexplorer.api

import com.sksamuel.elastic4s.ElasticDsl.{search, termQuery, _}
import com.sksamuel.elastic4s.http.JavaClient
import com.sksamuel.elastic4s.requests.searches.SearchResponse
import com.sksamuel.elastic4s.{ElasticClient, ElasticProperties, Response}
import org.constellation.blockexplorer.config.ConfigLoader

class ElasticSearchService(configLoader: ConfigLoader) {

  private val client = ElasticClient(JavaClient(ElasticProperties(configLoader.elasticsearchUrl)))

  def findTransaction(id: String): Response[SearchResponse] =
    client.execute {
      search(configLoader.elasticsearchTransactionsIndex).query(termQuery("hash", id))
    }.await

}
