package org.constellation.blockexplorer.api

import java.util

import com.amazonaws.services.lambda.runtime.events.{APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent}
import com.amazonaws.services.lambda.runtime.{Context, RequestHandler}
import org.constellation.blockexplorer.api.controller.{
  CheckpointBlockController,
  SnapshotController,
  TransactionController
}
import org.constellation.blockexplorer.api.mapper.{JsonEncoder, JsonExtractor}
import org.constellation.blockexplorer.api.output.ElasticSearchService
import org.constellation.blockexplorer.config.ConfigLoader

object Handler extends RequestHandler[APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent] {

  private val configLoader: ConfigLoader = new ConfigLoader
  private val jsonEncoder: JsonEncoder = new JsonEncoder
  private val jsonExtractor: JsonExtractor = new JsonExtractor
  private val elasticSearchService: ElasticSearchService = new ElasticSearchService(configLoader)
  private val transactionController: TransactionController =
    new TransactionController(elasticSearchService, jsonEncoder, jsonExtractor)
  private val checkpointBlockController: CheckpointBlockController =
    new CheckpointBlockController(elasticSearchService, jsonEncoder, jsonExtractor)
  private val snapshotController: SnapshotController =
    new SnapshotController(elasticSearchService, jsonEncoder, jsonExtractor)

  override def handleRequest(input: APIGatewayProxyRequestEvent, context: Context): APIGatewayProxyResponseEvent = {
    def log(message: String): Unit = context.getLogger.log(message)

    log("-- Received new request --")
    log(s"Method : ${input.getHttpMethod}")
    log(s"Proxy path : ${input.getPath}")
    log(s"Proxy parameters : ${input.getPathParameters}")
    log(s"Query parameters : ${input.getQueryStringParameters}")

    if (!input.getHttpMethod.contentEquals("GET"))
      ResponseCreator.errorResponse("Method doesn't support", 400)

    dispatchRequest(input.getPath, input.getPathParameters, input.getQueryStringParameters)
  }

  private def dispatchRequest(
    path: String,
    params: util.Map[String, String],
    queryParams: util.Map[String, String]
  ): APIGatewayProxyResponseEvent =
    path match {
      case x if x.matches("""/transactions/.*""") => transactionController.findBy(params.get("id"))
      case x if x.matches("""/transactions""") && containsQueryParam(queryParams, "sender") =>
        transactionController.findBySender(queryParams.get("sender"))
      case x if x.matches("""/transactions""") && containsQueryParam(queryParams, "receiver") =>
        transactionController.findByReceiver(queryParams.get("receiver"))
      case x if x.matches("""/transactions""") && containsQueryParam(queryParams, "address") =>
        transactionController.findByAddress(queryParams.get("address"))
      case x if x.matches("""/transactions""") && containsQueryParam(queryParams, "snapshot") =>
        transactionController.findBySnapshot(queryParams.get("snapshot"))
      case x if x.matches("""/checkpoints""") && containsQueryParam(queryParams, "soe") =>
        checkpointBlockController.findBySoe(queryParams.get("soe"))
      case x if x.matches("""/checkpoints/.*""") => checkpointBlockController.findBy(params.get("id"))
      case x if x.matches("""/snapshots/.*""")   => snapshotController.findBy(params.get("id"))
      case _                                     => ResponseCreator.errorResponse("Path doesn't exists", 400)
    }

  private def containsQueryParam(queryParams: util.Map[String, String], param: String): Boolean =
    if (queryParams == null) false else queryParams.containsKey(param)
}
