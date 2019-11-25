package org.constellation.blockexplorer.handler.mapper

import better.files.File
import io.circe.Encoder
import io.circe.generic.semiauto.deriveEncoder
import io.circe.syntax._
import org.constellation.blockexplorer.handler.serializer.{KryoSerializer, Serializer}
import org.constellation.blockexplorer.schema._
import org.constellation.consensus.StoredSnapshot
import org.mockito.ArgumentMatchersSugar
import org.scalatest.{FunSuite, Matchers}

class SnapshotJsonMapperTest extends FunSuite with ArgumentMatchersSugar with Matchers {

  private val snapshotFolder: String = "src/test/resources/snapshot"
  private val serializer: Serializer = new KryoSerializer
  private val storedSnapshotMapper = new StoredSnapshotMapper

  implicit val snapshotEncoder: Encoder[Snapshot] = deriveEncoder[Snapshot]
  implicit val checkpointEncoder: Encoder[CheckpointBlock] = deriveEncoder[CheckpointBlock]
  implicit val heightEncoder: Encoder[Height] = deriveEncoder[Height]
  implicit val transactionEncoder: Encoder[Transaction] = deriveEncoder[Transaction]
  implicit val lastTransactionRefEncoder: Encoder[LastTransactionRef] = deriveEncoder[LastTransactionRef]

  test("mapTransaction") {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList
      .head

    val s = storedSnapshotMapper.mapSnapshot(parsed).asJson
    println(s)
  }

  test("mapCheckpointBlock") {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList
      .head

    storedSnapshotMapper.mapCheckpointBlock(parsed).asJson
  }

  test("mapSnapshot") {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList
      .head

    storedSnapshotMapper.mapTransaction(parsed).asJson
  }
}
