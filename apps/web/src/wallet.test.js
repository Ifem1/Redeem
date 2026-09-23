import { describe, expect, it, vi } from "vitest";
import { connectInjectedWallet, restoreInjectedWallet } from "./wallet.ts";

const ACCOUNT = "0x1234567890123456789012345678901234567890";

function makeProvider(responses) {
  const calls = [];
  return {
    calls,
    request: vi.fn(async ({ method, params }) => {
      calls.push({ method, params });
      const response = responses[method];
      if (typeof response === "function") return response();
      if (response instanceof Error) throw response;
      return response;
    }),
  };
}

describe("injected EIP-1193 connection", () => {
  it("restores an approved account after refresh without requesting approval again", async () => {
    const provider = makeProvider({
      eth_accounts: [ACCOUNT],
      eth_chainId: "0xf22f",
    });
    const factory = vi.fn((_provider, account) => ({ account }));

    const result = await restoreInjectedWallet(provider, factory);

    expect(result?.account).toBe(ACCOUNT);
    expect(provider.calls.map(({ method }) => method)).toEqual([
      "eth_accounts",
      "eth_chainId",
    ]);
    expect(provider.calls.map(({ method }) => method)).not.toContain("eth_requestAccounts");
  });

  it("returns no session when the provider has no approved accounts", async () => {
    const provider = makeProvider({ eth_accounts: [] });
    await expect(restoreInjectedWallet(provider, vi.fn())).resolves.toBeNull();
  });

  it("connects a current Studionet account using standard provider requests", async () => {
    const provider = makeProvider({
      eth_requestAccounts: [ACCOUNT],
      eth_chainId: "0xf22f",
    });
    const factory = vi.fn((_provider, account) => ({ account }));

    const result = await connectInjectedWallet(provider, factory);

    expect(result.account).toBe(ACCOUNT);
    expect(result.client.account).toBe(ACCOUNT);
    expect(provider.calls.map(({ method }) => method)).toEqual([
      "eth_requestAccounts",
      "eth_chainId",
    ]);
  });

  it("switches a connected wallet to chain 61999 and verifies the switch", async () => {
    const provider = makeProvider({
      eth_requestAccounts: [ACCOUNT],
      eth_chainId: (() => { const values = ["0x1", "0xf22f"]; return () => values.shift(); })(),
      wallet_switchEthereumChain: null,
    });

    await connectInjectedWallet(provider, vi.fn(() => "write-client"));

    expect(provider.calls.map(({ method }) => method)).toEqual([
      "eth_requestAccounts",
      "eth_chainId",
      "wallet_switchEthereumChain",
      "eth_chainId",
    ]);
    expect(provider.calls[2].params).toEqual([{ chainId: "0xf22f" }]);
  });

  it("adds Studionet only when the provider reports an unknown chain", async () => {
    const provider = makeProvider({
      eth_requestAccounts: [ACCOUNT],
      eth_chainId: (() => { const values = ["0x1", "0xf22f"]; return () => values.shift(); })(),
      wallet_switchEthereumChain: Object.assign(new Error("unknown chain"), {
        code: 4902,
      }),
      wallet_addEthereumChain: null,
    });

    await connectInjectedWallet(provider, vi.fn(() => "write-client"));

    expect(provider.calls.map(({ method }) => method)).toEqual([
      "eth_requestAccounts",
      "eth_chainId",
      "wallet_switchEthereumChain",
      "wallet_addEthereumChain",
      "eth_chainId",
    ]);
    expect(provider.calls[3].params[0].chainId).toBe("0xf22f");
  });

  it("does not create a write client unless the final chain is 61999", async () => {
    const provider = makeProvider({
      eth_requestAccounts: [ACCOUNT],
      eth_chainId: (() => { const values = ["0x1", "0x1"]; return () => values.shift(); })(),
      wallet_switchEthereumChain: null,
    });
    const factory = vi.fn();

    await expect(connectInjectedWallet(provider, factory)).rejects.toThrow(
      "GenLayer Studionet (61999)",
    );
    expect(factory).not.toHaveBeenCalled();
  });

  it("rejects a provider response without an account", async () => {
    const provider = makeProvider({ eth_requestAccounts: [] });
    const factory = vi.fn();

    await expect(connectInjectedWallet(provider, factory)).rejects.toThrow(
      "did not return an account",
    );
    expect(factory).not.toHaveBeenCalled();
  });
});
