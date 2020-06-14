package org.constellation.blockexplorer.api

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent

import scala.collection.JavaConverters._

object ResponseCreator {

  def successResponse(body: String, statusCode: Integer = 200): APIGatewayProxyResponseEvent =
    new APIGatewayProxyResponseEvent()
      .withStatusCode(200)
      .withHeaders(
        Map(
          "Content-Type" -> "text/json"
        ).asJava
      )
      .withBody(body)

  def errorResponse(error: String, statusCode: Integer): APIGatewayProxyResponseEvent =
    new APIGatewayProxyResponseEvent()
      .withStatusCode(statusCode)
      .withHeaders(
        Map(
          "Content-Type" -> "text/json"
        ).asJava
      )
      .withBody(s""" {"error": "$error"} """)
}
