package org.constellation.blockexplorer.handler.mapper

import org.constellation.blockexplorer.schema._
import org.constellation.consensus.StoredSnapshot

class StoredSnapshotMapper {

  def mapOriginalTransaction(transaction: org.constellation.primitives.Transaction): TransactionOriginal =
    TransactionOriginal(
      edge = TransactionEdge(
        {
          val oe = transaction.edge.observationEdge
          ObservationEdge(
            oe.parents.map(p => TypedEdgeHash(p.hashReference, EdgeHashType.AddressHash, p.baseHash)),
            TypedEdgeHash(oe.data.hashReference, EdgeHashType.TransactionDataHash, oe.data.baseHash)
          )
        }, {
          val soe = transaction.edge.signedObservationEdge
          SignedObservationEdge(
            SignatureBatch(
              soe.signatureBatch.hash,
              soe.signatureBatch.signatures.map(hs => HashSignature(hs.signature, Id(hs.id.hex)))
            )
          )
        }, {
          val d = transaction.edge.data
          TransactionEdgeData(d.amount, LastTransactionRef(d.lastTxRef.hash, d.lastTxRef.ordinal), d.fee, d.salt)
        }
      ),
      lastTxRef = LastTransactionRef(transaction.lastTxRef.hash, transaction.lastTxRef.ordinal),
      isDummy = transaction.isDummy,
      isTest = transaction.isTest
    )

  def mapTransaction(storedSnapshot: StoredSnapshot): Seq[Transaction] =
    storedSnapshot.checkpointCache.flatMap(
      b =>
        b.checkpointBlock.transactions.map(t => {
          Transaction(
            t.hash,
            t.amount,
            t.dst.hash,
            t.src.hash,
            t.fee.getOrElse(0),
            t.isDummy,
            LastTransactionRef(t.lastTxRef.hash, t.lastTxRef.ordinal),
            storedSnapshot.snapshot.hash,
            b.checkpointBlock.baseHash,
            mapOriginalTransaction(t)
          )
        })
    )

  def mapCheckpointBlock(storedSnapshot: StoredSnapshot): Seq[CheckpointBlock] =
    storedSnapshot.checkpointCache.map(checkpointCache => {
      CheckpointBlock(
        checkpointCache.checkpointBlock.baseHash,
        checkpointCache.height.map(h => Height(h.min, h.max)).getOrElse(Height(0, 0)),
        checkpointCache.checkpointBlock.transactions.map(_.hash),
        Seq.empty[String],
        Seq.empty[String],
        checkpointCache.children.toLong,
        storedSnapshot.snapshot.hash
      )
    })

  def mapSnapshot(storedSnapshot: StoredSnapshot): Snapshot =
    Snapshot(
      storedSnapshot.snapshot.hash,
      storedSnapshot.height,
      storedSnapshot.snapshot.checkpointBlocks
    )
}
