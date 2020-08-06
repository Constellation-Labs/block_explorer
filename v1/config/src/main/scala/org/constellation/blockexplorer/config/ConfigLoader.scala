package org.constellation.blockexplorer.config

import com.typesafe.config.{Config, ConfigFactory}

class ConfigLoader {

  private val config: Config = ConfigFactory.load().resolve()
  private val elasticsearch = config.getConfig("block-explorer.elasticsearch")
  private val sqs = config.getConfig("block-explorer.sqs")

  val sqsUrl: String =
    sqs.getString("url")

  val elasticsearchUrl: String =
    elasticsearch.getString("url")

  val elasticsearchUrlV2: String =
    elasticsearch.getString("urlV2")

  val elasticsearchPort: Int =
    elasticsearch.getInt("port")

  val elasticsearchTransactionsIndex: String =
    elasticsearch.getString("indexes.transactions")

  val elasticsearchCheckpointBlocksIndex: String =
    elasticsearch.getString("indexes.checkpoint-blocks")

  val elasticsearchSnapshotsIndex: String =
    elasticsearch.getString("indexes.snapshots")
}
