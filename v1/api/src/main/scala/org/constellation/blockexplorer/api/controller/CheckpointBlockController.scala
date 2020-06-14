package org.constellation.blockexplorer.api.controller

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent
import com.sksamuel.elastic4s.{RequestFailure, RequestSuccess}
import org.constellation.blockexplorer.api.ResponseCreator
import org.constellation.blockexplorer.api.mapper.{JsonEncoder, JsonExtractor}
import org.constellation.blockexplorer.api.output.ElasticSearchService
import org.constellation.blockexplorer.schema.CheckpointBlock

class CheckpointBlockController(
  elasticSearchService: ElasticSearchService,
  jsonEncoder: JsonEncoder,
  jsonExtractor: JsonExtractor
) {

  def findBy(hash: String): APIGatewayProxyResponseEvent =
    elasticSearchService.findCheckpointBlock(hash) match {
      case RequestFailure(status, body, headers, error) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case RequestSuccess(status, body, headers, result) =>
        extractCheckpointBlockFrom(body) match {
          case Nil => ResponseCreator.errorResponse("Cannot find checkpoint block by base hash", 404)
          case x   => ResponseCreator.successResponse(jsonEncoder.checkpointEncoder(x.head).toString())
        }
    }

  def findBySoe(hash: String): APIGatewayProxyResponseEvent =
    elasticSearchService.findCheckpointBlockBySoe(hash) match {
      case RequestFailure(status, body, headers, error) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case RequestSuccess(status, body, headers, result) =>
        extractCheckpointBlockFrom(body) match {
          case Nil => ResponseCreator.errorResponse("Cannot find checkpoint block by soe hash", 404)
          case x   => ResponseCreator.successResponse(jsonEncoder.checkpointEncoder(x.head).toString())
        }
    }

  def extractCheckpointBlockFrom(body: Option[String]): Seq[CheckpointBlock] =
    body
      .flatMap(response => jsonExtractor.extractCheckpointBlockEsResult(response))
      .getOrElse(Seq.empty)
}
