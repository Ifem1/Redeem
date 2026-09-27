import "./style.css";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "genlayer-js";
import { CalldataAddress } from "genlayer-js/types";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { getAddress } from "viem";
import { ArrowRight, Copy, Menu, X, Wallet, Zap } from "lucide-react";
import { CHAIN_ID, STATUSES, bond, buildRecurringPayload, formatGen, guards, parseGen } from "./protocol.js";
import { connectInjectedWallet, restoreInjectedWallet } from "./wallet";
import { makeDemoIssueValues, makeDemoOutcomeValues } from "./demo";

const address = import.meta.env.VITE_REDEEM_CONTRACT_ADDRESS || "";
let client: any = null;
const readClient: any = createClient({ chain: studionet });
const nav = [
  ["/guarantees", "Guarantees"],
  ["/recurring", "Recurring"],
  ["/my-rights", "My Rights"],
  ["/my-issued", "My Issued"],
  ["/activity", "Activity"],
  ["/about", "About"],
];
const short = (v: string) => (v ? `${v.slice(0, 6)}…${v.slice(-4)}` : "—");
function addressKey(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase();
  const bytes = value && typeof value === "object" && "bytes" in value ? (value as any).bytes : value;
  if (bytes instanceof Uint8Array) {
    return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  return "";
}
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
  const walletClient = (provider: any, account: string) => createClient({
    chain: studionet,
    provider,
    account: account as `0x${string}`,
  });
  const restore = async () => {
    if (!window.ethereum) return;
    try {
      const connected = await restoreInjectedWallet(window.ethereum, walletClient);
      if (connected) {
        client = connected.client;
        setWallet(connected.account);
      }
    } catch (e: any) {
      setWalletError(e.message || "Wallet session could not be restored.");
    }
  };
  useEffect(() => {
    void restore();
    const provider = window.ethereum as any;
    if (!provider?.on) return;
    const accountsChanged = (accounts: unknown) => {
      if (!Array.isArray(accounts) || !accounts[0]) {
        setWallet("");
        client = null;
      } else {
        void restore();
      }
    };
    const chainChanged = () => void restore();
    provider.on("accountsChanged", accountsChanged);
    provider.on("chainChanged", chainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", accountsChanged);
      provider.removeListener?.("chainChanged", chainChanged);
    };
  }, []);
  const connect = async () => {
    setWalletError("");
    if (!window.ethereum) {
      setWalletError("Install an external wallet to continue.");
      return;
    }
    try {
      const connected = await connectInjectedWallet(
        window.ethereum,
        walletClient,
      );
      client = connected.client;
      setWallet(connected.account);
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
async function fetchRecurring(start=0) {
  const counter=Number(await read("get_recurring_counter"));const records=await read("list_recurring",[start,25]);return {counter,rows:records.map((row:any,index:number)=>({id:start+index+1,...row})).filter((row:any)=>row.id<=counter)}
}
async function write(name: string, args: any[] = [], value = 0n) {
  const hash = await client.writeContract({
    address,
    functionName: name,
    args,
    value,
  });
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED });
  if (receipt.resultName === "MAJORITY_DISAGREE" || receipt.resultName === "NO_MAJORITY" || receipt.resultName === "DISAGREE") throw Error("Consensus is undetermined.");
  if (receipt.resultName !== "SUCCESS") throw Error("Contract execution failed.");
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
  type = "button",
}: {
  children: any;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      className={secondary ? "btn secondary" : "btn"}
      type={type}
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
      .then((all: any[]) => { const field = method.includes("beneficiary") ? "beneficiary" : "issuer"; const wanted = addressKey(wallet); setRows(all.filter((g) => addressKey(g[field]) === wanted).map((g) => ({...g, status_name: typeof g.status === "number" ? STATUSES[g.status] : g.status_name}))); })
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
  const [recurring, setRecurring] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const setDemoOutcomes = (isRecurring: boolean) => {
    Object.entries(makeDemoOutcomeValues(isRecurring)).forEach(([name, value]) => {
      const field = formRef.current?.elements.namedItem(name) as HTMLInputElement | null;
      if (field) field.value = value;
    });
  };
  const loadDemo = () => {
    const values = makeDemoIssueValues();
    Object.entries(values).forEach(([name, value]) => {
      const field = formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (field) field.value = value;
    });
    const required = formRef.current?.elements.namedItem("required") as HTMLInputElement | null;
    if (required) required.checked = true;
    if (recurring) setDemoOutcomes(true);
    setDemoMode(true);
    setStatus("Demo values loaded. Review them, then choose whether to fund this real guarantee.");
  };
  const useLiveForm = () => {
    setDemoMode(false);
    setStatus("Live mode enabled. Review the fields, then fund through your connected wallet.");
  };
  const submit = async (e: any) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      setStatus("Awaiting wallet approval…");
      const beneficiaryInput = String(f.get("beneficiary") || "").trim();
      let beneficiary: `0x${string}`;
      try {
        beneficiary = getAddress(beneficiaryInput) as `0x${string}`;
      } catch {
        throw Error("Enter a valid 20-byte beneficiary wallet address.");
      }
      const escrow = parseGen(String(f.get("escrow") || "").trim());
      const beneficiaryBytes = new Uint8Array(
        beneficiary.slice(2).match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)),
      );
      const calldataBeneficiary = new CalldataAddress(beneficiaryBytes);
      const ts = (name: string, fallback: bigint) => {
        const v = String(f.get(name) || "");
        if (!v) return fallback;
        const milliseconds = new Date(v).getTime();
        if (!Number.isFinite(milliseconds)) throw Error(`Enter a valid ${name} date.`);
        return BigInt(Math.floor(milliseconds / 1000));
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
      const title = String(f.get("title") || "").trim();
      const terms = String(f.get("terms") || "").trim();
      const sourceRules = JSON.stringify([source]);
      const outcomeRules = JSON.stringify(outcomes);
      const end = ts("coverageEnd", 4102444800n);
      const recurringCount = Number(f.get("epochCount") || 2);
      if (recurring) {
        const firstStart = ts("firstCoverageStart", 0n), duration = BigInt(String(f.get("epochDurationSeconds") || "0")), grace = BigInt(String(f.get("claimGraceSeconds") || "0"));
        const recurringPayload=buildRecurringPayload({beneficiary:calldataBeneficiary,title,terms,epochCount:recurringCount,firstStart,epochDuration:duration,claimGrace:grace,escrowWei:escrow,sources:JSON.parse(sourceRules),outcomes});
        setStatus(`Maximum liability: ${formatGen(escrow)} GEN · ${formatGen(escrow / BigInt(recurringCount))} GEN per epoch. Awaiting wallet approval…`);
        await write("create_recurring_guarantee", recurringPayload, escrow);
      } else await write(
        "create_guarantee",
        [
          calldataBeneficiary,
          title,
          terms,
          ts("coverageStart", 0n),
          end,
          ts("evaluationAt", 0n),
          ts("claimDeadline", end),
          escrow,
          sourceRules,
          outcomeRules,
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
      <Card className={demoMode ? "demo-card active" : "demo-card"}>
        <div className="row">
          <div>
            <div className="eyebrow">FRONTEND TESTING</div>
            <h3>Use demo data</h3>
            <p className="muted">Loads sample values into the form. Nothing is submitted automatically. Review or edit the values, then choose whether to fund the guarantee.</p>
          </div>
          {demoMode ? (
            <Button type="button" onClick={useLiveForm} secondary>USE LIVE FORM</Button>
          ) : (
            <Button type="button" onClick={loadDemo} secondary>USE DEMO DATA</Button>
          )}
        </div>
        {demoMode && <p className="status">DEMO VALUES LOADED — funding is still a real wallet transaction and requires your explicit click and approval.</p>}
      </Card>
      <Card>
        <form ref={formRef} onSubmit={submit} className="form">
          <label><span>Guarantee mode</span><select value={recurring ? "recurring" : "single"} onChange={(event) => { const isRecurring = event.target.value === "recurring"; setRecurring(isRecurring); if (demoMode) setDemoOutcomes(isRecurring); }}><option value="single">Single coverage (existing REDEEM)</option><option value="recurring">Recurring coverage epochs (new)</option></select></label>
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
            {recurring && <><label>First coverage start<input name="firstCoverageStart" type="datetime-local" defaultValue={demoMode ? makeDemoIssueValues().firstCoverageStart : ""} required /></label><label>Epoch count (2–12)<input name="epochCount" type="number" min="2" max="12" defaultValue="4" required /></label><label>Epoch duration (seconds)<input name="epochDurationSeconds" type="number" min="1" defaultValue="604800" required /></label><label>Claim grace after epoch ends (seconds)<input name="claimGraceSeconds" type="number" min="1" defaultValue="604800" required /></label></>}
            {!recurring && <><label>
              Escrow (GEN)
              <input name="escrow" type="number" min="1" required />
            </label></>}
            {recurring && <label>Maximum total liability (GEN)<input name="escrow" type="number" min="0.000000000000000001" step="any" required /></label>}
            {!recurring && <>
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
            </>}
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
          <Button type="submit">
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
  const refreshGuarantee = async () => {
    let latest = await read("get_guarantee", [Number(id)]);
    setG(latest);
    // GenLayer's finalized write and public read can become visible on
    // adjacent blocks. Poll briefly so the UI reflects the accepted action.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 750));
      latest = await read("get_guarantee", [Number(id)]);
      setG(latest);
    }
  };
  const act = async (name: string, key: string, value = 0n) => {
    try {
      setBusy(name);
      await write(name, [Number(id)], value);
      await refreshGuarantee();
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
                  type="button"
                  className={enabled ? "action-button enabled" : "action-button"}
                  disabled={!enabled || !!busy}
                  title={enabled ? `Run ${name.replaceAll("_", " ")}` : "This action is unavailable for the current contract state or connected wallet."}
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
            Green buttons are available for the current contract state and connected wallet. Disabled actions are guarded by the protocol.
          </p>
        </Card>
      </div>
    </>
  );
}
function RecurringDetail({ id }: { id: string }) {
  const [parent,setParent]=useState<any>(null);const [epochs,setEpochs]=useState<any[]>([]);const [histories,setHistories]=useState<any[][]>([]);const [error,setError]=useState("");const [busy,setBusy]=useState("");const [wallet,setWallet]=useState("");
  const refresh=async()=>{const p=await read("get_recurring_guarantee",[Number(id)]);setParent(p);const rows=await Promise.all(Array.from({length:Number(p.epoch_count)},(_,n)=>read("get_epoch",[Number(id),n])));setEpochs(rows);setHistories(await Promise.all(rows.map(async(e:any,n:number)=>{const out:any[]=[];for(let r=1;r<=Number(e.review_attempts);r++)try{out.push(await read("get_epoch_manifest",[Number(id),n,false,r]))}catch{continue}for(let r=1;r<=Number(e.challenge_attempts);r++)try{out.push(await read("get_epoch_manifest",[Number(id),n,true,r]))}catch{continue}return out}))) };
  useEffect(()=>{void refresh().catch(e=>setError(e.message));const sync=()=>void restoreInjectedWallet(window.ethereum,(provider,account)=>createClient({chain:studionet,provider,account:account as `0x${string}`})).then(x=>{client=x?.client||null;setWallet(x?.account||"")}).catch(()=>{client=null;setWallet("")});sync();window.ethereum?.on?.("accountsChanged",sync);window.ethereum?.on?.("chainChanged",sync);return()=>{window.ethereum?.removeListener?.("accountsChanged",sync);window.ethereum?.removeListener?.("chainChanged",sync)}},[id]);
  const act=async(method:string,n?:number,value=0n)=>{try{setBusy(method+(n??""));await write(method,n===undefined?[Number(id)]:[Number(id),n],value);await refresh()}catch(e:any){setError(e.message)}finally{setBusy("")}};
  const now=Math.floor(Date.now()/1000);
  if(error)return <Card className="empty"><h3>Unable to read recurring guarantee</h3><p>{error}</p></Card>;if(!parent)return <Card className="empty">Loading recurring guarantee…</Card>;
  return <><section className="pagehead"><div className="eyebrow">RECURRING GUARANTEE #{id}</div><h1>{parent.title}</h1><p>{parent.terms}</p></section><Card><div className="eyebrow">PARENT ACCOUNTING · {parent.status===0?"ACTIVE":"FINALIZED"}</div><div className="money"><span>Funded<strong>{formatGen(parent.funded)} GEN</strong></span><span>Remaining<strong>{formatGen(parent.remaining)} GEN</strong></span><span>Paid<strong>{formatGen(parent.paid)} GEN</strong></span><span>Refunded<strong>{formatGen(parent.refunded)} GEN</strong></span></div>{parent.status===0&&epochs.every(e=>[5,6,7,8].includes(Number(e.status)))&&<button className="action-button enabled" disabled={!!busy||!wallet||!client} onClick={()=>act("finalize_recurring")}>{busy==="finalize_recurring"?"Working…":"Finalize parent and refund unused liability"}</button>}</Card><h2>Coverage timeline</h2><div className="grid">{epochs.map((e,n)=>{const status=Number(e.status),connected=!!wallet&&!!client,beneficiary=connected&&addressKey(parent.beneficiary)===wallet.toLowerCase(),party=connected&&(addressKey(parent.issuer)===wallet.toLowerCase()||beneficiary);const bondAmount=BigInt(e.liability)*500n/10000n;const retryNow=now>=Number(e.last_review_attempt_at)+3600&&(now<Number(e.opened_at)+604800||(now<Number(e.opened_at)+608400&&Number(e.last_review_attempt_at)<=Number(e.opened_at)+604800));const challengeRetry=now>=Number(e.last_challenge_attempt_at)+3600&&now<Number(e.challenge_opened_at)+608400&&Number(e.last_challenge_attempt_at)<=Number(e.challenge_opened_at)+604800;const actions:[string,boolean,bigint?][]=[["open_epoch",status===0&&!!beneficiary&&now>=Number(e.coverage_end)&&now<=Number(e.claim_deadline)],["evaluate_epoch",connected&&[1,2].includes(status)&&retryNow],["challenge_epoch",status===3&&!!party&&now<Number(e.challenge_deadline),bondAmount],["resolve_epoch_challenge",connected&&status===4&&challengeRetry],["finalize_epoch",connected&&status===3&&now>=Number(e.challenge_deadline)],["finalize_epoch_inconclusive",connected&&status===2&&now>=Number(e.opened_at)+608400&&now>=Number(e.last_review_attempt_at)+3600],["finalize_stalled_epoch_challenge",connected&&status===4&&now>=Number(e.challenge_opened_at)+608400&&now>=Number(e.last_challenge_attempt_at)+3600],["expire_epoch",connected&&status===0&&now>Number(e.claim_deadline)]];return <Card key={n}><div className="eyebrow">EPOCH {n+1} · {STATUSES[status]||["","","","","","SETTLED_PAID","SETTLED_DENIED","EXPIRED_REFUNDED","INCONCLUSIVE_REFUNDED"][status]||"UNKNOWN"}</div><p>Coverage {new Date(Number(e.coverage_start)*1000).toLocaleString()} – {new Date(Number(e.coverage_end)*1000).toLocaleString()}</p><p>Claim deadline {new Date(Number(e.claim_deadline)*1000).toLocaleString()}</p><p>Liability <strong>{formatGen(e.liability)} GEN</strong></p><p>Outcome {e.final_code||e.provisional_code||"Pending"}</p><p>Paid {formatGen(e.paid)} GEN · Refunded {formatGen(e.refunded)} GEN</p>{actions.filter(([,enabled])=>enabled).map(([method,,value])=><button key={method} className="action-button enabled" disabled={!!busy} onClick={()=>act(method,n,value||0n)}>{busy===method+n?"Working…":method.replaceAll("_"," ")}{method==="challenge_epoch"?` · ${formatGen(value||0n)} GEN`:""}</button>)}{(histories[n]||[]).map((m,i)=><div className="rule" key={i}><small>{m.phase} · {m.status} · {m.outcome_code||"NO OUTCOME"}</small><p>{m.evidence_summary}</p><p>{m.reasoning}</p></div>)}</Card>})}</div>{!wallet&&<p className="muted">Connect a Studionet wallet to submit epoch actions. Evaluations and finalization are permissionless.</p>}{error&&<p className="status">{error}</p>}</>
}
function RecurringList({navigate}:{navigate:(path:string)=>void}) {
 const [rows,setRows]=useState<any[]>([]);const [error,setError]=useState("");const [start,setStart]=useState(0);const [counter,setCounter]=useState(0);useEffect(()=>{fetchRecurring(start).then(result=>{setRows(result.rows);setCounter(result.counter)}).catch(e=>setError(e.message))},[start]);
 return <><section className="pagehead"><div className="eyebrow">RECURRING COVERAGE</div><h1>One promise.<br/><em>Many periods.</em></h1><p>Each epoch is independently claimable, reviewed, challenged and settled.</p><Button onClick={()=>navigate("/issue")}>Create recurring guarantee <ArrowRight size={17}/></Button></section>{error?<Card className="empty"><p>{error}</p></Card>:<><div className="grid">{rows.map(g=><Card key={g.id}><div className="eyebrow">PARENT #{g.id}</div><h3>{g.title}</h3><p>{g.epoch_count} coverage epochs · {g.status===0?"ACTIVE":"FINALIZED"}</p><p>Funded {formatGen(g.funded)} GEN · Remaining {formatGen(g.remaining)} GEN</p><button className="textbtn" onClick={()=>navigate(`/recurring/${g.id}`)}>View timeline <ArrowRight size={15}/></button></Card>)}</div><div className="hero-actions"><Button secondary disabled={start===0} onClick={()=>setStart(Math.max(0,start-25))}>Previous</Button><Button secondary disabled={start+25>=counter} onClick={()=>setStart(start+25)}>Next</Button></div></>}</>
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
    ) : path === "/recurring" ? (
      <RecurringList navigate={navigate} />
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
    ) : path.startsWith("/recurring/") ? (
      <RecurringDetail id={path.split("/")[2]} />
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
