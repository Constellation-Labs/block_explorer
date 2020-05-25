package org.constellation.blockexplorer.handler.mapper

import better.files.File
import org.constellation.blockexplorer.handler.serializer.{KryoSerializer, Serializer}
import org.constellation.consensus.StoredSnapshot
import org.mockito.ArgumentMatchersSugar
import org.scalatest.{FreeSpec, Matchers}

class SnapshotJsonMapperTest extends FreeSpec with ArgumentMatchersSugar with Matchers {

  private val snapshotFolder: String = "src/test/resources/snapshot"
  private val serializer: Serializer = new KryoSerializer
  private val storedSnapshotMapper = new StoredSnapshotMapper
  private val snapshotMapper = new SnapshotJsonMapper

  "mapSnapshot" in {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList
      .head

    val snapshot = storedSnapshotMapper.mapSnapshot(parsed)
    snapshotMapper.mapSnapshotToJson(snapshot)
  }

  "mapCheckpointBlock" in {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList
      .head

    val checkpoints = storedSnapshotMapper.mapCheckpointBlock(parsed)
    checkpoints.map(snapshotMapper.mapCheckpointBlockToJson)
  }

  "mapTransaction" - {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList
      .head

    val txs = storedSnapshotMapper.mapTransaction(parsed)
    txs.map(snapshotMapper.mapTransactionToJson)

    val before = parsed.checkpointCache.headOption.flatMap(_.checkpointBlock.transactions.headOption).get
    val after = txs.headOption.get

    "amount matches" in {
      before.amount shouldBe after.amount
    }

    "src matches sender" in {
      before.src.address shouldBe after.sender
    }

    "dst matches receiver" in {
      before.dst.address shouldBe after.receiver
    }

    "lastTxRef matches" in {
      before.lastTxRef.prevHash shouldBe after.lastTransactionRef.prevHash
      before.lastTxRef.ordinal shouldBe after.lastTransactionRef.ordinal
    }

    "hash matches" in {
      before.hash shouldBe after.hash
    }

    "transactionOriginal matches" in {
      before.lastTxRef.ordinal shouldBe after.transactionOriginal.lastTxRef.ordinal
      before.lastTxRef.prevHash shouldBe after.transactionOriginal.lastTxRef.prevHash
      before.edge.data.lastTxRef.prevHash shouldBe after.transactionOriginal.edge.data.lastTxRef.prevHash
      before.edge.data.lastTxRef.ordinal shouldBe after.transactionOriginal.edge.data.lastTxRef.ordinal
      before.isDummy shouldBe after.transactionOriginal.isDummy
      before.isTest shouldBe after.transactionOriginal.isTest
    }

    println(txs.headOption.map(snapshotMapper.mapTransactionToJson))
  }
}
