package org.constellation.blockexplorer.api.controller

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent
import com.sksamuel.elastic4s.{RequestFailure, RequestSuccess}
import org.constellation.blockexplorer.api.ResponseCreator
import org.constellation.blockexplorer.api.mapper.{JsonEncoder, JsonExtractor}
import org.constellation.blockexplorer.api.output.ElasticSearchService
import org.constellation.blockexplorer.schema.Transaction

class TransactionController(
  elasticSearchService: ElasticSearchService,
  jsonEncoder: JsonEncoder,
  jsonExtractor: JsonExtractor
) {

  def findBy(hash: String): APIGatewayProxyResponseEvent =
    elasticSearchService.findTransaction(hash) match {
      case RequestFailure(status, body, headers, error) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case RequestSuccess(status, body, headers, result) =>
        extractTransactionsFrom(body) match {
          case Nil => ResponseCreator.errorResponse("Cannot find transaction", 404)
          case x   => ResponseCreator.successResponse(jsonEncoder.transactionEncoder(x.head).toString())
        }
    }

  def findBySender(address: String): APIGatewayProxyResponseEvent =
    elasticSearchService.findTransactionForAddress(address) match {
      case RequestFailure(status, body, headers, error) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case RequestSuccess(status, body, headers, result) =>
        extractTransactionsFrom(body) match {
          case Nil => ResponseCreator.errorResponse("Cannot find transactions for sender", 404)
          case x   => ResponseCreator.successResponse(jsonEncoder.transactionsToJson(x).getOrElse("""[]""").toString)
        }
    }

  def extractTransactionsFrom(body: Option[String]): Seq[Transaction] =
    body
      .flatMap(response => jsonExtractor.extractTransactionsEsResult(response))
      .getOrElse(Seq.empty)
}