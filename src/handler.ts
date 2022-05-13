import { getClient } from "./opensearch";
import {
  getBalanceByAddressHandler,
  getBlock,
  getGlobalSnapshot,
  getGlobalSnapshotRewards,
  getTransaction,
} from "./service";

const osClient = getClient();

export const globalSnapshot = (event) => getGlobalSnapshot(event, osClient)();
export const globalSnapshotRewards = (event) =>
  getGlobalSnapshotRewards(event, osClient)();
export const block = (event) => getBlock(event, osClient)();
export const transaction = (event) => getTransaction(event, osClient)();
export const balanceByAddress = (event) =>
  getBalanceByAddressHandler(event, osClient)();
