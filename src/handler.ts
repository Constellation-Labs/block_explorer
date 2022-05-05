import { getClient } from './opensearch'
import { getBalanceByAddressHandler, getGlobalSnapshot, getGlobalSnapshotRewards } from './service'

const osClient = getClient()

export const globalSnapshot = event => getGlobalSnapshot(event, osClient)()
export const globalSnapshotRewards = event => getGlobalSnapshotRewards(event, osClient)()
export const balanceByAddress = event => getBalanceByAddressHandler(event, osClient)()
