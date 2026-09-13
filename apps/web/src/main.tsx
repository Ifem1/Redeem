import "./style.css";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import { ArrowRight, Copy, Menu, X, Wallet, Zap } from "lucide-react";
import { CHAIN_ID, STATUSES, bond, formatGen, guards, parseGen } from "./protocol.js";

const address = import.meta.env.VITE_REDEEM_CONTRACT_ADDRESS || "";
let client: any = null;
const readClient: any = createClient({ chain: studionet });
const nav = [
  ["/guarantees", "Guarantees"],
  ["/my-rights", "My Rights"],
  ["/my-issued", "My Issued"],
  ["/activity", "Activity"],
  ["/about", "About"],
];
const short = (v: string) => (v ? `${v.slice(0, 6)}…${v.slice(-4)}` : "—");
function useRoute() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const f = () => setPath(location.pathname);
    addEventListener("popstate", f);
    return () => removeEventListener("popstate", f);
  }, []);
  return [
    path,
    (p: string) => {
      history.pushState({}, "", p);
      setPath(p);
    },
  ] as const;
}
function useWallet() {
  const [wallet, setWallet] = useState("");
  const [walletError, setWalletError] = useState("");
  const connect = async () => {
    setWalletError("");
    if (!window.ethereum) {
      setWalletError("Install an external wallet to continue.");
      return;
    }
    try {
      const a = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chain = Number(
        await window.ethereum.request({ method: "eth_chainId" }),
      );
      if (chain !== CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError?.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: `0x${CHAIN_ID.toString(16)}`,
                chainName: "GenLayer Studionet",
                nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
                rpcUrls: ["https://studio.genlayer.com/api"],
                blockExplorerUrls: ["https://genlayer-explorer.vercel.app"],
              }],
            });
          } else {
            setWalletError("Switch to GenLayer Studionet (61999) in your wallet to continue.");
            return;
          }
        }
      }
      setWallet(a[0]);
      client = createClient({
        chain: studionet,
        provider: window.ethereum,
        account: a[0],
      });
      await client.connect("studionet");
    } catch (e: any) {
      setWalletError(e.message || "Wallet connection failed.");
    }
  };
  const disconnect = () => {
    setWallet("");
    client = null;
  };
  return {
    wallet,
    connect,
    disconnect,
    walletError,
  };
}
async function read(name: string, args: any[] = []) {
  if (!address) throw Error("VITE_REDEEM_CONTRACT_ADDRESS is not configured.");
  return readClient.readContract({ address, functionName: name, args });
}
async function fetchGuarantees() {
  const counter = Number(await read("get_guarantee_counter"));
  const ids = Array.from({ length: Math.max(0, counter) }, (_, i) => i + 1);
  const records = await Promise.all(ids.map(async (id) => ({ id, ...(await read("get_guarantee", [id])) })));
  return records;
}
async function write(name: string, args: any[] = [], value = 0n) {
  const hash = await client.writeContract({
    address,
    functionName: name,
    args,
    value,
  });
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, fullTransaction: true });
  if (receipt.resultName === "MAJORITY_DISAGREE" || receipt.resultName === "NO_MAJORITY" || receipt.resultName === "DISAGREE") throw Error("Consensus is undetermined.");
  if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
    if (receipt.txExecutionResultName === ExecutionResult.NOT_VOTED) throw Error("Transaction execution is still pending.");
    throw Error("Contract execution failed.");
  }
  return receipt;
}
function Shell({
  children,
  wallet,
  connect,
  disconnect,
  walletError,
  navigate,
}: {
  children: any;
  wallet: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  walletError: string;
  navigate: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const current = location.pathname;
  const copy = () => navigator.clipboard?.writeText(wallet);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".wallet-wrap")) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  return (
    <>
      <div className="ambient">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <nav>
        <button className="brand" onClick={() => navigate("/")}>
          <img src="/redeem-mark.png" alt="" aria-hidden="true" />
          REDEEM<span>·</span>
        </button>
        <button
          className="mobile"
          aria-label="Open navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <div className={`navlinks ${open ? "show" : ""}`}>
          {nav.map(([p, l]) => (
            <button
              className={
                (
                  p === "/"
                    ? current === "/" || current === "/overview"
                    : current === p
                )
                  ? "active"
                  : ""
              }
              key={p}
              onClick={() => {
                navigate(p);
                setOpen(false);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="navright wallet-wrap">
          <span className="network">
            <i /> STUDIONET · {CHAIN_ID}
          </span>
          <button className="wallet" onClick={() => setMenu(!menu)}>
            <Wallet size={16} />
            {wallet ? short(wallet) : "Connect wallet"}
          </button>
          {menu && !wallet && (
            <div className="wallet-menu">
              <div className="mono">CHOOSE WALLET</div>
              <button
                onClick={() => {
                  setMenu(false);
                  connect();
                }}
              >
                Injected wallet
              </button>
            </div>
          )}
          {menu && wallet && (
            <div className="wallet-menu">
              <div className="mono">
                INJECTED WALLET
              </div>
              <strong>{short(wallet)}</strong>
              <button onClick={copy}>
                <Copy size={14} /> Copy address
              </button>
              <button
                onClick={() => {
                  disconnect();
                  setMenu(false);
                }}
              >
                <X size={14} /> Disconnect
              </button>
            </div>
          )}
        </div>
      </nav>
      {walletError && (
        <div className="wallet-error" role="status">
          {walletError}
        </div>
      )}
      <main>{children}</main>
      <footer>
        <span>REDEEM / ESCROW-BACKED GUARANTEES</span>
        <span>GENLAYER STUDIONET · {CHAIN_ID}</span>
      </footer>
    </>
  );
}
function Button({
  children,
  onClick,
  disabled = false,
  secondary = false,
}: {
  children: any;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      className={secondary ? "btn secondary" : "btn"}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function Card({
  children,
  className = "",
}: {
  children: any;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
function Home({ navigate, wallet }: { navigate: any; wallet: string }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    read("get_contract_accounting")
      .then(setStats)
      .catch(() => setStats(false));
  }, []);
  return (
    <>
      <section className="hero">
        <div className="eyebrow">ESCROW-BACKED GUARANTEES / GENLAYER 61999</div>
        <h1>
          PROMISES, BACKED
          <br />
          <em>BEFORE THEY BREAK.</em>
        </h1>
        <p>
          Fund the promise now. Let frozen terms and verified evidence determine
          the payout later.
        </p>
        <div className="hero-actions">
          <Button onClick={() => navigate("/issue")}>
            Issue guarantee <ArrowRight size={17} />
          </Button>
          <Button secondary onClick={() => navigate("/guarantees")}>
            Explore guarantees
          </Button>
        </div>
      </section>
      <div className="section-head">
        <div>
          <div className="eyebrow">LIVE PROTOCOL</div>
          <h2>Settlement, in public.</h2>
        </div>
        <button className="textbtn" onClick={() => navigate("/guarantees")}>
          Open registry <ArrowRight size={15} />
        </button>
      </div>
      <div className="stats">
        {[
          ["TOTAL FUNDED", stats?.funded],
          ["REMAINING ESCROW", stats?.remaining],
          ["BENEFICIARY PAID", stats?.paid],
          ["ISSUER REFUNDS", stats?.refunded],
        ].map(([l, v]) => (
          <Card key={l}>
            <div className="eyebrow">{l}</div>
            <strong>
              {stats === false ? "Unavailable" : v == null ? "—" : `${formatGen(v)} GEN`}{" "}
              <small>GEN</small>
            </strong>
            <p>From deployed contract accounting</p>
          </Card>
        ))}
      </div>
    </>
  );
}
function GuaranteeCard({ g, navigate }: { g: any; navigate: any }) {
  const id = g.id;
  const status = typeof g.status === "number" ? (STATUSES[g.status] ?? "UNKNOWN") : (g.status_name ?? "UNKNOWN");
  return (
    <Card className="guarantee">
      <div className="row">
        <span className="mono">GUARANTEE #{String(id)}</span>
        <span className="badge">{status}</span>
      </div>
      <h3>{g.title ?? g[1] ?? "Untitled guarantee"}</h3>
      <p>{g.terms ?? g[2] ?? "Frozen protocol terms"}</p>
      <div className="data">
        <span>
          ESCROW<strong>{g.escrow_total == null && g[7] == null ? "—" : `${formatGen(g.escrow_total ?? g[7])} GEN`}</strong>
        </span>
        <span>
          BENEFICIARY<strong>{short(g.beneficiary ?? g[3] ?? "")}</strong>
        </span>
        <span>
          ISSUER<strong>{short(g.issuer ?? "")}</strong>
        </span>
      </div>
      <button className="textbtn" onClick={() => navigate(`/guarantees/${id}`)}>
        View guarantee <ArrowRight size={15} />
      </button>
    </Card>
  );
}
function Collection({
  title,
  method,
  wallet,
  navigate,
}: {
  title: string;
  method: string;
  wallet: string;
  navigate: any;
}) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    if (!wallet) {
      setRows([]);
      return;
    }
    fetchGuarantees()
      .then((all: any[]) => { const field = method.includes("beneficiary") ? "beneficiary" : "issuer"; const wanted = wallet.toLowerCase(); setRows(all.filter((g) => g[field]?.toLowerCase() === wanted).map((g) => ({...g, status_name: typeof g.status === "number" ? STATUSES[g.status] : g.status_name}))); })
      .catch(() => setRows(null));
  }, [wallet, method]);
  return (
    <>
      <section className="pagehead">
        <div className="eyebrow">PORTFOLIO VIEW</div>
        <h1>{title}</h1>
        <p>
          {method.includes("beneficiary")
            ? "Guarantees where this wallet is the named beneficiary."
            : "Promises this wallet has economically backed."}
        </p>
        <Button onClick={() => navigate("/issue")}>Issue guarantee <ArrowRight size={17} /></Button>
      </section>
      {!wallet ? (
        <Card className="empty">
          <Wallet />
          <h3>Connect your wallet</h3>
          <p>Connect an external wallet to view this collection.</p>
        </Card>
      ) : rows === null ? (
        <Card className="empty">
          <h3>Protocol data unavailable</h3>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="empty">
          <h3>No guarantees found</h3>
          <p>No guarantees are associated with this wallet yet.</p>
        </Card>
      ) : (
        <div className="grid">
          {rows.map((g, i) => (
            <GuaranteeCard key={i} g={g} navigate={navigate} />
          ))}
        </div>
      )}
    </>
  );
}
function Guarantees({ navigate }: { navigate: any }) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    fetchGuarantees()
      .then((all: any[]) => setRows(all.map((g) => ({...g, status_name: typeof g.status === "number" ? STATUSES[g.status] : g.status_name}))))
      .catch(() => setRows(null));
  }, []);
  return (
    <>
      <section className="pagehead">
        <div className="eyebrow">PUBLIC REGISTRY</div>
        <h1>Guarantees</h1>
        <p>Immutable promises backed by escrow.</p>
        <Button onClick={() => navigate("/issue")}>Issue guarantee <ArrowRight size={17} /></Button>
      </section>
      {rows === null ? (
        <Card className="empty">
          <h3>Protocol data unavailable</h3>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="empty">
          <h3>No guarantees issued yet.</h3>
        </Card>
      ) : (
        <div className="grid">
          {rows.map((g, i) => (
            <GuaranteeCard key={i} g={g} navigate={navigate} />
          ))}
        </div>
      )}
    </>
  );
}
function Issue() {
  const [status, setStatus] = useState("");
  const submit = async (e: any) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      setStatus("Awaiting wallet approval…");
      const escrow = parseGen(String(f.get("escrow")));
      const ts = (name: string, fallback: number) => {
        const v = String(f.get(name) || "");
        return v ? Math.floor(new Date(v).getTime() / 1000) : fallback;
      };
      const source = {
        label: String(f.get("sourceLabel")),
        url: String(f.get("sourceUrl")),
        authority: String(f.get("authority")),
        required: f.get("required") === "on",
      };
      const outcomes = [
        {
          code: String(f.get("zeroCode")),
          description: String(f.get("zeroDescription")),
          payout_bps: 0,
        },
        {
          code: String(f.get("paidCode")),
          description: String(f.get("paidDescription")),
          payout_bps: Number(f.get("paidBps")),
        },
      ];
      if (
        !source.label ||
        !source.url.startsWith("https://") ||
        outcomes[1].payout_bps <= 0
      )
        throw Error("Add a valid HTTPS source and nonzero payout outcome.");
      const end = ts("coverageEnd", 4102444800);
      await write(
        "create_guarantee",
        [
          f.get("beneficiary"),
          f.get("title"),
          f.get("terms"),
          ts("coverageStart", 0),
          end,
          ts("evaluationAt", 0),
          ts("claimDeadline", end),
          escrow,
          JSON.stringify([source]),
          JSON.stringify(outcomes),
        ],
        escrow,
      );
      setStatus("Successful — guarantee funded.");
    } catch (x: any) {
      setStatus(`Failed: ${x.message}`);
    }
  };
  return (
    <>
      <section className="pagehead">
        <div className="eyebrow">NEW GUARANTEE</div>
        <h1>Fund a promise.</h1>
        <p>These terms become immutable once funded.</p>
      </section>
      <Card>
        <form onSubmit={submit} className="form">
          <label>
            Beneficiary address
            <input name="beneficiary" placeholder="0x…" required />
          </label>
          <label>
            Guarantee title
            <input
              name="title"
              placeholder="What are you promising?"
              required
            />
          </label>
          <label>
            Terms
            <textarea
              name="terms"
              placeholder="Describe the promise and evidence standard."
              required
            />
          </label>
          <div className="twocol">
            <label>
              Escrow (GEN)
              <input name="escrow" type="number" min="1" required />
            </label>
            <label>
              Coverage start
              <input name="coverageStart" type="datetime-local" required />
            </label>
            <label>
              Coverage end
              <input name="coverageEnd" type="datetime-local" required />
            </label>
            <label>
              Evaluation earliest
              <input name="evaluationAt" type="datetime-local" required />
            </label>
            <label>
              Claim deadline
              <input name="claimDeadline" type="datetime-local" required />
            </label>
          </div>
          <div className="rule">
            <div className="eyebrow">EVIDENCE SOURCE</div>
            <div className="twocol">
              <input name="sourceLabel" placeholder="Source label" required />
              <input name="sourceUrl" placeholder="https://…" required />
            </div>
            <label>
              Authority
              <select name="authority" defaultValue="PRIMARY">
                <option>PRIMARY</option>
                <option>CORROBORATING</option>
              </select>
            </label>
            <label>
              <input name="required" type="checkbox" defaultChecked /> Required
              source
            </label>
          </div>
          <div className="rule">
            <div className="eyebrow">OUTCOME MATRIX</div>
            <div className="twocol">
              <input name="zeroCode" defaultValue="MET" required />
              <input
                name="zeroDescription"
                defaultValue="Promise met"
                required
              />
              <input name="paidCode" defaultValue="BREACH" required />
              <input
                name="paidDescription"
                defaultValue="Promise breached"
                required
              />
              <input
                name="paidBps"
                type="number"
                min="1"
                max="10000"
                defaultValue="10000"
                required
              />
            </div>
          </div>
          <Button>
            FUND GUARANTEE <Zap size={16} />
          </Button>
          {status && <p className="status">{status}</p>}
        </form>
      </Card>
    </>
  );
}
function Detail({ id, wallet }: { id: string; wallet: string }) {
  const [g, setG] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    read("get_guarantee", [Number(id)])
      .then(setG)
      .catch((e) => setError(e.message));
  }, [id]);
  const act = async (name: string, key: string, value = 0n) => {
    try {
      setBusy(name);
      await write(name, [Number(id)], value);
      setG(await read("get_guarantee", [Number(id)]));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  if (error)
    return (
      <Card className="empty">
        <h3>Unable to read guarantee</h3>
        <p>Financial actions are disabled until contract state is available.</p>
      </Card>
    );
  if (!g)
    return (
      <Card className="empty">
        <p>Loading guarantee…</p>
      </Card>
    );
  const gate = guards(g, wallet, Date.now() / 1000);
  const actions = [
    ["open_redemption", "open"],
    ["evaluate_redemption", "evaluate"],
    ["challenge_redemption", "challenge"],
    ["resolve_challenge", "resolve"],
    ["finalize_redemption", "finalize"],
    ["finalize_inconclusive", "inconclusive"],
    ["finalize_stalled_challenge", "stalled"],
    ["reclaim_expired_guarantee", "reclaim"],
  ];
  return (
    <>
      <section className="pagehead">
        <div className="row">
          <div>
            <div className="eyebrow">GUARANTEE #{id}</div>
            <h1>{g.title ?? "Guarantee detail"}</h1>
          </div>
          <span className="badge">
            {typeof g.status === "number" ? (STATUSES[g.status] ?? "UNKNOWN") : (g.status_name ?? "UNKNOWN")}
          </span>
        </div>
      </section>
      <div className="detail">
        <div>
          <Card>
            <div className="eyebrow">PROMISE</div>
            <p className="largecopy">
              {g.terms ?? "Frozen terms stored on GenLayer."}
            </p>
          </Card>
          <Card>
            <div className="eyebrow">ESCROW ACCOUNTING</div>
            <div className="money">
              <span>
                Total<strong>{g.escrow_total == null ? "—" : `${formatGen(g.escrow_total)} GEN`}</strong>
              </span>
              <span>
                Remaining<strong>{g.escrow_remaining == null ? "—" : `${formatGen(g.escrow_remaining)} GEN`}</strong>
              </span>
            </div>
          </Card>
        </div>
        <Card className="actioncard">
          <div className="eyebrow">ACTION CENTRE</div>
          {actions.map(([name, key]) => {
            const enabled = gate[key];
            const value =
              key === "challenge" ? bond(BigInt(g.escrow_total)) : 0n;
            return (
              <div className="action" key={name}>
                <span>{name.replaceAll("_", " ")}</span>
                <button
                  disabled={!enabled || !!busy}
                  onClick={() => act(name, key, value)}
                >
                  {busy === name
                    ? "Working…"
                    : key === "challenge"
                      ? `Challenge · ${formatGen(value)} GEN`
                      : "Run"}
                </button>
              </div>
            );
          })}
          <p className="muted">
            Actions remain disabled unless the loaded contract state and wallet
            permit them.
          </p>
        </Card>
      </div>
    </>
  );
}
function About({ navigate }: { navigate: any }) {
  return (
    <>
      <section className="pagehead">
        <div className="eyebrow">THE PROTOCOL</div>
        <h1>
          AI classifies.
          <br />
          <em>Code pays.</em>
        </h1>
        <p>
          Redeem turns uncertain real-world promises into frozen, escrow-backed
          agreements.
        </p>
      </section>
      <div className="hero-actions"><Button onClick={() => navigate("/issue")}>Issue guarantee <ArrowRight size={17} /></Button></div>
      <div className="steps">
        {[
          ["01", "FREEZE", "Terms and evidence rules are fixed at creation."],
          ["02", "FUND", "Escrow makes the promise economically real."],
          [
            "03",
            "EVALUATE",
            "GenLayer reviews evidence under the frozen policy.",
          ],
          ["04", "SETTLE", "Deterministic code routes the exact payout."],
        ].map((x) => (
          <Card key={x[0]}>
            <span className="mono">{x[0]}</span>
            <h3>{x[1]}</h3>
            <p>{x[2]}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
function App() {
  const [path, navigate] = useRoute();
  const {
    wallet,
    connect,
    disconnect,
    walletError,
  } = useWallet();
  let page =
    path === "/" || path === "/overview" ? (
      <Home navigate={navigate} wallet={wallet} />
    ) : path === "/issue" ? (
      <Issue />
    ) : path === "/guarantees" ? (
      <Guarantees navigate={navigate} />
    ) : path === "/my-rights" ? (
      <Collection
        title="Your rights"
        method="list_guarantees_by_beneficiary"
        wallet={wallet}
        navigate={navigate}
      />
    ) : path === "/my-issued" ? (
      <Collection
        title="Issued guarantees"
        method="list_guarantees_by_issuer"
        wallet={wallet}
        navigate={navigate}
      />
    ) : path === "/about" ? (
      <About navigate={navigate} />
    ) : path === "/activity" ? (
      <Card className="empty">
        <h3>No global activity feed</h3>
        <p>
          Redeem exposes contract state and manifests directly; it does not
          invent an indexer.
        </p>
        <Button onClick={() => navigate("/issue")}>Issue guarantee <ArrowRight size={17} /></Button>
      </Card>
    ) : path.startsWith("/guarantees/") ? (
      <Detail id={path.split("/")[2]} wallet={wallet} />
    ) : (
      <Guarantees navigate={navigate} />
    );
  return (
    <Shell
      wallet={wallet}
      connect={connect}
      disconnect={disconnect}
      walletError={walletError}
      navigate={navigate}
    >
      {page}
    </Shell>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
