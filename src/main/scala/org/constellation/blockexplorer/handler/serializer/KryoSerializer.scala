package org.constellation.blockexplorer.handler.serializer

import com.twitter.chill.{KryoPool, ScalaKryoInstantiator}
import org.constellation.serializer.ConstellationKryoRegistrar

class KryoSerializer extends Serializer {

  val kryoPool = KryoPool.withByteArrayOutputStream(
    10,
    new ScalaKryoInstantiator()
      .setRegistrationRequired(true)
      .withRegistrar(new ConstellationKryoRegistrar())
  )

  def serialize(anyRef: AnyRef): Array[Byte] =
    kryoPool.toBytesWithClass(anyRef)

  def deserialize[T](message: Array[Byte]): T =
    kryoPool.fromBytes(message).asInstanceOf[T]
}
