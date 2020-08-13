package org.constellation.blockexplorer.api.controller

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent
import com.sksamuel.elastic4s.requests.searches.SearchResponse
import com.sksamuel.elastic4s.{RequestFailure, RequestSuccess, Response}
import org.constellation.blockexplorer.api.ResponseCreator
import org.constellation.blockexplorer.api.mapper.{JsonEncoder, JsonExtractor}
import org.constellation.blockexplorer.api.output.ElasticSearchService
import org.constellation.blockexplorer.schema.{Snapshot, Transaction}

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
          case x =>
            ResponseCreator.successResponse(jsonEncoder.transactionEncoder(x.head).toString())
        }
    }

  def findBySender(address: String): APIGatewayProxyResponseEvent =
    elasticSearchService.findTransactionForSender(address) match {
      case xs if xs.forall(_.isError) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case xs =>
        extractMergeAndSortTransactions(xs) match {
          case Nil => ResponseCreator.errorResponse("Cannot find transactions for sender", 404)
          case x   => ResponseCreator.successResponse(jsonEncoder.transactionsToJson(x).getOrElse("""[]""").toString)
        }
    }

  def findByReceiver(address: String): APIGatewayProxyResponseEvent =
    elasticSearchService.findTransactionForReceiver(address) match {
      case xs if xs.forall(_.isError) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case xs =>
        extractMergeAndSortTransactions(xs) match {
          case Nil => ResponseCreator.errorResponse("Cannot find transactions for receiver", 404)
          case x   => ResponseCreator.successResponse(jsonEncoder.transactionsToJson(x).getOrElse("""[]""").toString)
        }
    }

  def findByAddress(address: String): APIGatewayProxyResponseEvent =
    elasticSearchService.findTransactionForAddress(address) match {
      case xs if xs.forall(_.isError) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case xs =>
        extractMergeAndSortTransactions(xs) match {
          case Nil => ResponseCreator.errorResponse("Cannot find transactions for address", 404)
          case x   => ResponseCreator.successResponse(jsonEncoder.transactionsToJson(x).getOrElse("""[]""").toString)
        }
    }

  def findBySnapshot(snapshot: String): APIGatewayProxyResponseEvent = {
    def extractSnapshotFrom(body: Option[String]): Seq[Snapshot] =
      body
        .flatMap(response => jsonExtractor.extractSnapshotEsResult(response))
        .getOrElse(Seq.empty)

    val result = if (snapshot == "latest") {
      elasticSearchService.findHighestSnapshot()
    } else if (snapshot.forall(_.isDigit) && snapshot.length < 64) {
      elasticSearchService.findSnapshotByHeight(snapshot.toLong)
    } else {
      elasticSearchService.findSnapshot(snapshot)
    }

    result match {
      case RequestFailure(status, body, headers, error) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case RequestSuccess(status, body, headers, result) =>
        extractSnapshotFrom(body) match {
          case Nil =>
            ResponseCreator.errorResponse("Cannot find snapshot", 404)
          case xs  =>
            elasticSearchService.findTransactionForSnapshotHash(xs.head.hash) match {
              case RequestFailure(status, body, headers, error) =>
                ResponseCreator.errorResponse("ElasticSearch service error", 500)
              case RequestSuccess(status, body, headers, result) =>
                extractTransactionsFrom(body) match {
                  case Nil => ResponseCreator.errorResponse("Cannot find transactions for snapshot", 404)
                  case xs  => ResponseCreator.successResponse(jsonEncoder.transactionsToJson(xs).getOrElse("""[]""").toString)
                }
            }
        }
    }
  }

  def extractTransactionsFrom(body: Option[String]): Seq[Transaction] =
    body
      .flatMap(response => jsonExtractor.extractTransactionsEsResult(response))
      .getOrElse(Seq.empty)

  def extractMergeAndSortTransactions(xs: Seq[Response[SearchResponse]]): Seq[Transaction] =
    xs
      .collect { case RequestSuccess(_, body, _, _) => body }
      .flatMap(extractTransactionsFrom)
      .distinct
      .sortBy(_.lastTransactionRef.ordinal)
      .reverse
}
