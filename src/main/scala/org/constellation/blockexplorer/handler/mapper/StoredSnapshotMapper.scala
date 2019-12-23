package org.constellation.blockexplorer.handler.mapper

import org.constellation.blockexplorer.schema.{CheckpointBlock, Height, LastTransactionRef, Snapshot, Transaction}
import org.constellation.consensus.StoredSnapshot

class StoredSnapshotMapper {

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
            b.checkpointBlock.baseHash
          )
        })
    )

  def mapCheckpointBlock(storedSnapshot: StoredSnapshot): Seq[CheckpointBlock] =
    storedSnapshot.checkpointCache.map(checkpointCache => {
      CheckpointBlock(
        checkpointCache.checkpointBlock.baseHash,
        checkpointCache.height.map(h => Height(h.min, h.max)).getOrElse(Height(0, 0)),
        checkpointCache.checkpointBlock.transactions.map(_.baseHash),
        Seq.empty[String],
        Seq.empty[String],
        checkpointCache.children.toLong,
        storedSnapshot.snapshot.hash
      )
    })

  def mapSnapshot(storedSnapshot: StoredSnapshot): Snapshot =
    Snapshot(
      storedSnapshot.snapshot.hash,
      storedSnapshot.snapshot.checkpointBlocks
    )
}
