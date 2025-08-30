import { ApiPromise, WsProvider } from "@polkadot/api"
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

export class PolkadotRaffleClient {
  private api: ApiPromise | null = null
  private wsProvider: WsProvider | null = null

  constructor(private wsUrl = "wss://rpc.polkadot.io") {}

  async connect(): Promise<void> {
    this.wsProvider = new WsProvider(this.wsUrl)
    this.api = await ApiPromise.create({ provider: this.wsProvider })
  }

  async getAccounts(): Promise<InjectedAccountWithMeta[]> {
    await web3Enable("Raffle DApp")
    return await web3Accounts()
  }

  async getBalance(address: string): Promise<string> {
    if (!this.api) throw new Error("API not connected")

    const {
      data: { free },
    } = await this.api.query.system.account(address)
    return free.toString()
  }

  async disconnect(): Promise<void> {
    if (this.wsProvider) {
      await this.wsProvider.disconnect()
    }
  }
}
