package org.constellation.blockexplorer.api

import com.amazonaws.services.lambda.runtime.events.{APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent}
import com.amazonaws.services.lambda.runtime.{Context, RequestHandler}
import com.sksamuel.elastic4s.{RequestFailure, RequestSuccess}
import io.circe.Decoder
import io.circe.generic.semiauto.deriveDecoder
import org.constellation.blockexplorer.api.model.TransactionRequest
import org.constellation.blockexplorer.config.ConfigLoader

import scala.collection.JavaConverters._

object Handler extends RequestHandler[APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent] {

  implicit val transactionRequestEncoder: Decoder[TransactionRequest] = deriveDecoder[TransactionRequest]

  private val configLoader: ConfigLoader = new ConfigLoader
  private val elasticSearchService: ElasticSearchService = new ElasticSearchService(configLoader)

  override def handleRequest(input: APIGatewayProxyRequestEvent, context: Context): APIGatewayProxyResponseEvent = {
    val id = input.getQueryStringParameters.get("id")
    elasticSearchService.findTransaction(id) match {
      case RequestSuccess(status, body, headers, result) => successResponse(body.getOrElse(""))
      case RequestFailure(status, body, headers, error)  => errorResponse(error.reason, status)
    }
  }

  private def successResponse(body: String, statusCode: Integer = 200) =
    new APIGatewayProxyResponseEvent()
      .withStatusCode(200)
      .withHeaders(
        Map(
          "Content-Type" -> "text/json"
        ).asJava
      )
      .withBody(body)

  private def errorResponse(error: String, statusCode: Integer) =
    new APIGatewayProxyResponseEvent()
      .withStatusCode(statusCode)
      .withHeaders(
        Map(
          "Content-Type" -> "text/json"
        ).asJava
      )
      .withBody(s""" {"error": "$error"} """)
}
