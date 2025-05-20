import { getClient } from "./opensearch";
import {
  getBalanceByAddress,
  getBlock,
  getCurrencyBalanceByAddress,
  getCurrencyBlock,
  getCurrencyFeeTransaction,
  getCurrencyFeeTransactionsByAddress,
  getCurrencyFeeTransactionsByDestination,
  getCurrencyFeeTransactionsBySource,
  getCurrencySnapshot,
  getCurrencySnapshotFeeTransactions,
  getCurrencySnapshotRewards,
  getCurrencySnapshots,
  getCurrencySnapshotTransactions,
  getCurrencyTransaction,
  getCurrencyTransactions,
  getCurrencyTransactionsByAddress,
  getCurrencyTransactionsByDestination,
  getCurrencyTransactionsBySource,
  getGlobalSnapshot,
  getGlobalSnapshotRewards,
  getGlobalSnapshots,
  getGlobalSnapshotTransactions,
  getMetagraphs,
  getCurrencySnapshotsByOwnerAddress,
  getTransaction,
  getTransactions,
  getTransactionsByAddress,
  getTransactionsByDestination,
  getTransactionsBySource,
} from "./service";

const osClient = getClient();

export const globalSnapshot = (event) => getGlobalSnapshot(event, osClient)();
export const globalSnapshots = (event) => getGlobalSnapshots(event, osClient)();
export const globalSnapshotRewards = (event) =>
  getGlobalSnapshotRewards(event, osClient)();
export const globalSnapshotTransactions = (event) =>
  getGlobalSnapshotTransactions(event, osClient)();
export const block = (event) => getBlock(event, osClient)();

export const transaction = (event) => getTransaction(event, osClient, null)();
export const transactions = (event) => getTransactions(event, osClient)();
export const transactionsByAddress = (event) =>
  getTransactionsByAddress(event, osClient)();
export const transactionsBySource = (event) =>
  getTransactionsBySource(event, osClient)();
export const transactionsByDestination = (event) =>
  getTransactionsByDestination(event, osClient)();
export const balanceByAddress = (event) =>
  getBalanceByAddress(event, osClient)();

// Currency

export const currencySnapshot = (event) =>
  getCurrencySnapshot(event, osClient)();
export const currencySnapshots = (event) =>
  getCurrencySnapshots(event, osClient)();
export const currencySnapshotsByOwnerAddress = (event) =>
  getCurrencySnapshotsByOwnerAddress(event, osClient)();
export const currencySnapshotRewards = (event) =>
  getCurrencySnapshotRewards(event, osClient)();
export const currencySnapshotTransactions = (event) =>
  getCurrencySnapshotTransactions(event, osClient)();

export const currencyBlock = (event) => getCurrencyBlock(event, osClient)();

export const currencyTransaction = (event) =>
  getCurrencyTransaction(event, osClient)();
export const currencyTransactions = (event) =>
  getCurrencyTransactions(event, osClient)();
export const currencyTransactionsByAddress = (event) =>
  getCurrencyTransactionsByAddress(event, osClient)();
export const currencyTransactionsBySource = (event) =>
  getCurrencyTransactionsBySource(event, osClient)();
export const currencyTransactionsByDestination = (event) =>
  getCurrencyTransactionsByDestination(event, osClient)();

export const currencyFeeTransaction = (event) =>
  getCurrencyFeeTransaction(event, osClient)();
export const currencySnapshotFeeTransactions = (event) =>
  getCurrencySnapshotFeeTransactions(event, osClient)();
export const currencyFeeTransactionsByDestination = (event) =>
  getCurrencyFeeTransactionsByDestination(event, osClient)();
export const currencyFeeTransactionsBySource = (event) =>
  getCurrencyFeeTransactionsBySource(event, osClient)();
export const currencyFeeTransactionsByAddress = (event) =>
  getCurrencyFeeTransactionsByAddress(event, osClient)();
export const currencyBalanceByAddress = (event) =>
  getCurrencyBalanceByAddress(event, osClient)();

export const metagraphs = (event) => getMetagraphs(event, osClient)();
