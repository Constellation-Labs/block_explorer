package org.constellation.blockexplorer.api

import com.amazonaws.services.lambda.runtime.events.{APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent}
import com.amazonaws.services.lambda.runtime.{Context, RequestHandler}
import org.constellation.blockexplorer.api.controller.TransactionController
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

  override def handleRequest(input: APIGatewayProxyRequestEvent, context: Context): APIGatewayProxyResponseEvent = {
    def log(message: String): Unit = context.getLogger.log(message)

    log("-- Received new request --")
    log(s"Method : ${input.getHttpMethod}")
    log(s"Proxy path : ${input.getPath}")
    log(s"Proxy parameters : ${input.getPathParameters}")
    log(s"Query parameters : ${input.getQueryStringParameters}")

    val id = input.getPathParameters.get("id")
    if (id.isEmpty) ResponseCreator.errorResponse("You should pass id", 400)
    if (!input.getHttpMethod.contentEquals("GET")) ResponseCreator.errorResponse("Method doesn't support", 400)

    input.getPath match {
      case s if s.matches("""/transactions/.*""") => transactionController.findTransaction(id)
      case _                                      => ResponseCreator.errorResponse("Path doesn't exists", 400)
    }
  }
}
