import { getClient } from './opensearch';
import {
  getBalanceByAddress,
  getBlock,
  getGlobalSnapshot,
  getGlobalSnapshotRewards,
  getGlobalSnapshots,
  getGlobalSnapshotTransactions,
  getTransaction,
  getTransactions,
  getTransactionsByAddress,
  getTransactionsByDestination,
  getTransactionsBySource,
} from './service';

const osClient = getClient();

export const globalSnapshot = (event) => getGlobalSnapshot(event, osClient)();
export const globalSnapshots = (event) => getGlobalSnapshots(event, osClient)();
export const globalSnapshotRewards = (event) =>
    getGlobalSnapshotRewards(event, osClient)();
export const globalSnapshotTransactions = (event) =>
    getGlobalSnapshotTransactions(event, osClient)();
export const block = (event) => getBlock(event, osClient)();
export const transaction = (event) => getTransaction(event, osClient)();
export const transactions = (event) => getTransactions(event, osClient)();
export const transactionsByAddress = (event) =>
    getTransactionsByAddress(event, osClient)();
export const transactionsBySource = (event) =>
    getTransactionsBySource(event, osClient)();
export const transactionsByDestination = (event) =>
    getTransactionsByDestination(event, osClient)();
export const balanceByAddress = (event) =>
    getBalanceByAddress(event, osClient)();
