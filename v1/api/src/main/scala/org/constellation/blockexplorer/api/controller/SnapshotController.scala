package org.constellation.blockexplorer.api.controller

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent
import com.sksamuel.elastic4s.{RequestFailure, RequestSuccess}
import org.constellation.blockexplorer.api.ResponseCreator
import org.constellation.blockexplorer.api.mapper.{JsonEncoder, JsonExtractor}
import org.constellation.blockexplorer.api.output.ElasticSearchService
import org.constellation.blockexplorer.schema.Snapshot

class SnapshotController(
  elasticSearchService: ElasticSearchService,
  jsonEncoder: JsonEncoder,
  jsonExtractor: JsonExtractor
) extends Controller {

  def findBy(hash: String): APIGatewayProxyResponseEvent = {
    val snapshot = if (hash == "latest") {
      elasticSearchService.findHighestSnapshot()
    } else if (hash.forall(_.isDigit) && hash.length < 64) {
      elasticSearchService.findSnapshotByHeight(hash.toLong)
    } else {
      elasticSearchService.findSnapshot(hash)
    }

    snapshot match {
      case RequestFailure(status, body, headers, error) =>
        ResponseCreator.errorResponse("ElasticSearch service error", 500)
      case RequestSuccess(status, body, headers, result) =>
        extractSnapshotFrom(body) match {
          case Nil => ResponseCreator.errorResponse("Cannot find snapshot", 404)
          case x   => ResponseCreator.successResponse(jsonEncoder.snapshotEncoder(x.head).toString())
        }
    }
  }

  def extractSnapshotFrom(body: Option[String]): Seq[Snapshot] =
    body
      .flatMap(response => jsonExtractor.extractSnapshotEsResult(response))
      .getOrElse(Seq.empty)
}
