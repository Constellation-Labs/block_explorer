package org.constellation.blockexplorer.handler.mapper

import better.files.File
import org.constellation.blockexplorer.handler.serializer.{KryoSerializer, Serializer}
import org.constellation.consensus.StoredSnapshot
import org.mockito.ArgumentMatchersSugar
import org.scalatest.{FunSuite, Matchers}

class SnapshotJsonMapperTest extends FunSuite with ArgumentMatchersSugar with Matchers {

  private val snapshotFolder: String = "src/test/resources/snapshot"
  private val serializer: Serializer = new KryoSerializer
  private val storedSnapshotMapper = new StoredSnapshotMapper
  private val snapshotMapper = new SnapshotJsonMapper

  test("mapSnapshot") {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList
      .head

    val snapshot = storedSnapshotMapper.mapSnapshot(parsed)
    snapshotMapper.mapSnapshotToJson(snapshot)
  }

  test("mapCheckpointBlock") {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList
      .head

    val checkpoints = storedSnapshotMapper.mapCheckpointBlock(parsed)
    checkpoints.map(snapshotMapper.mapCheckpointBlockToJson)
  }

  test("mapTransaction") {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList
      .head

    val txs = storedSnapshotMapper.mapTransaction(parsed)
    txs.map(snapshotMapper.mapTransactionToJson)
    println(txs.headOption.map(snapshotMapper.mapTransactionToJson))
  }
}
