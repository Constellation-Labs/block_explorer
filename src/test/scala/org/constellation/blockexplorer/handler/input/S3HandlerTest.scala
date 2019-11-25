package org.constellation.blockexplorer.handler.input

import better.files.File
import org.constellation.blockexplorer.handler.serializer.{KryoSerializer, Serializer}
import org.constellation.consensus.StoredSnapshot
import org.mockito.ArgumentMatchersSugar
import org.scalatest.{FunSuite, Matchers}

class S3HandlerTest extends FunSuite with ArgumentMatchersSugar with Matchers {

  private val snapshotFolder: String = "src/test/resources/snapshot"
  private val serializer: Serializer = new KryoSerializer

  test("should load and deserialize snapshots") {
    val parsed = File(snapshotFolder).list.toSeq
      .map(s => serializer.deserialize[StoredSnapshot](s.byteArray))
      .toList

    parsed.size shouldBe 2
    parsed.head.isInstanceOf[StoredSnapshot] shouldBe true
  }
}
