export interface InjectedProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

type WalletClientFactory<T> = (
  provider: InjectedProvider,
  account: string,
) => T;

const STUDIONET = {
  chainId: "0xf22f",
  chainName: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://studio.genlayer.com/api"],
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

function numericChainId(value: unknown): number {
  if (typeof value !== "string" || !/^0x[\da-f]+$/i.test(value)) {
    return Number.NaN;
  }
  return Number.parseInt(value, 16);
}

export async function connectInjectedWallet<T>(
  provider: InjectedProvider,
  createWalletClient: WalletClientFactory<T>,
): Promise<{ account: string; client: T }> {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || !accounts[0]) {
    throw new Error("The wallet did not return an account.");
  }

  let chainId = numericChainId(
    await provider.request({ method: "eth_chainId" }),
  );
  if (chainId !== 61999) {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: STUDIONET.chainId }],
      });
    } catch (error) {
      if ((error as { code?: number })?.code !== 4902) throw error;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [STUDIONET],
      });
    }
    chainId = numericChainId(
      await provider.request({ method: "eth_chainId" }),
    );
  }

  if (chainId !== 61999) {
    throw new Error("Switch to GenLayer Studionet (61999) in your wallet to continue.");
  }

  return {
    account: accounts[0],
    client: createWalletClient(provider, accounts[0]),
  };
}
