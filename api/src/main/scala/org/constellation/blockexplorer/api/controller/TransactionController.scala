package org.constellation.blockexplorer.api.controller

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent
import com.sksamuel.elastic4s.{RequestFailure, RequestSuccess}
import org.constellation.blockexplorer.api.ResponseCreator
import org.constellation.blockexplorer.api.mapper.{JsonEncoder, JsonExtractor}
import org.constellation.blockexplorer.api.output.ElasticSearchService

class TransactionController(
  elasticSearchService: ElasticSearchService,
  jsonEncoder: JsonEncoder,
  jsonExtractor: JsonExtractor
) {

  def findTransaction(id: String): APIGatewayProxyResponseEvent =
    elasticSearchService.findTransaction(id) match {
      case RequestFailure(status, body, headers, error) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case RequestSuccess(status, body, headers, result) =>
        val extracted = body
          .flatMap(response => jsonExtractor.extractTransactionsEsResult(response))
          .getOrElse(Seq.empty)
        extracted match {
          case Nil => ResponseCreator.errorResponse("Cannot find transactions", 404)
          case x   => ResponseCreator.successResponse(jsonEncoder.transactionEncoder(x.head).toString())
        }
    }
}
