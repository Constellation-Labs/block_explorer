package org.constellation.blockexplorer.handler.serializer

trait Serializer {

  def serialize(anyRef: AnyRef): Array[Byte]

  def deserialize[T](message: Array[Byte]): T
}
