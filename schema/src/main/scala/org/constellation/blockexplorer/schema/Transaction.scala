package org.constellation.blockexplorer.schema

import enumeratum._

case class TransactionEdgeData(
  amount: Long,
  lastTxRef: LastTransactionRef,
  fee: Option[Long],
  salt: Long
)

sealed trait EdgeHashType extends EnumEntry

object EdgeHashType extends CirceEnum[EdgeHashType] with Enum[EdgeHashType] {
  case object AddressHash extends EdgeHashType
  case object TransactionDataHash extends EdgeHashType

  val values = findValues
}

case class TypedEdgeHash(
  hashReference: String,
  hashType: EdgeHashType,
  baseHash: Option[String]
)

case class ObservationEdge(
  parents: Seq[TypedEdgeHash],
  data: TypedEdgeHash
)

case class Id(hex: String)

case class HashSignature(
  signature: String,
  id: Id
)

case class SignatureBatch(
  hash: String,
  signatures: Seq[HashSignature]
)

case class SignedObservationEdge(
  signatureBatch: SignatureBatch
)

case class TransactionEdge(
  observationEdge: ObservationEdge,
  signedObservationEdge: SignedObservationEdge,
  data: TransactionEdgeData
)

case class TransactionOriginal(
  edge: TransactionEdge,
  lastTxRef: LastTransactionRef,
  isDummy: Boolean = false,
  isTest: Boolean = false
)

case class Transaction(
  hash: String,
  amount: Long,
  receiver: String,
  sender: String,
  fee: Long,
  isDummy: Boolean,
  lastTransactionRef: LastTransactionRef,
  snapshotHash: String,
  checkpointBlock: String,
  transactionOriginal: TransactionOriginal
)
