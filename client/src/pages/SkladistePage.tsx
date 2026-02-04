import React, { useContext, useEffect, useMemo, useState } from "react";
import AuthContext from "../contexts/AuthContext";

type WarehouseDTO = {
  id: number;
  name: string;
  location: string;
  maxPackages: number;
};

type PackageDTO = {
  id: number;
  name: string;
  senderAddress: string;
  warehouseId: number;
  perfumeIds: number[];
  status: "spakovana" | "poslata";
};

const GATEWAY_BASE = "http://localhost:4000";

function pill(status: PackageDTO["status"]) {
  const base: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
  if (status === "poslata") {
    return { ...base, background: "#E8FFF1", color: "#0F7A3D", border: "1px solid #BFF2D3" };
  }
  return { ...base, background: "#FFF7E6", color: "#8A5A00", border: "1px solid #FFE1A6" };
}

export default function SkladistePage() {
  const auth = useContext(AuthContext);
  const token = auth?.token || "";

  async function fetchWarehouses(): Promise<WarehouseDTO[]> {
    const r = await fetch(`${GATEWAY_BASE}/api/v1/skladiste/skladista`, {
      method: "GET",
      headers: {
        Authorization: token ? "Bearer " + token : "",
        "Content-Type": "application/json",
      },
    });

    if (r.status === 401) throw new Error("Nisi ulogovana (401). Uloguj se ponovo.");
    if (r.status === 403) throw new Error("Nemaš pravo pristupa (403). Proveri ulogu.");
    if (!r.ok) throw new Error("Ne mogu da učitam skladišta.");

    return r.json();
  }

  async function fetchPackages(): Promise<PackageDTO[]> {
    const r = await fetch(`${GATEWAY_BASE}/api/v1/skladiste/ambalaze`, {
      method: "GET",
      headers: {
        Authorization: token ? "Bearer " + token : "",
        "Content-Type": "application/json",
      },
    });

    if (r.status === 401) throw new Error("Nisi ulogovana (401). Uloguj se ponovo.");
    if (r.status === 403) throw new Error("Nemaš pravo pristupa (403). Proveri ulogu.");
    if (!r.ok) throw new Error("Ne mogu da učitam ambalaže.");

    return r.json();
  }

  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"novo" | "naziv" | "status">("novo");

  async function load() {
  setLoading(true);
  setErr(null);
  try {
    const wh = await fetchWarehouses();
    setWarehouses(wh);
    setPackages([]); // nema ambalaža jer backend nema rutu
  } catch (e: any) {
    setErr(e?.message || "Greška pri učitavanju.");
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // kad se token pojavi posle logina, ponovo učitaj

  const whMap = useMemo(() => {
    const m = new Map<number, WarehouseDTO>();
    warehouses.forEach((w) => m.set(w.id, w));
    return m;
  }, [warehouses]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    let list = packages.filter((p) => {
      const w = whMap.get(p.warehouseId);
      const whText = w ? `${w.name} ${w.location}` : "";
      const txt = `${p.name} ${p.senderAddress} ${p.status} ${p.perfumeIds.join(",")} ${whText}`;
      return txt.toLowerCase().includes(needle);
    });

    if (sort === "naziv") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "status") list = [...list].sort((a, b) => a.status.localeCompare(b.status));
    if (sort === "novo") list = [...list].sort((a, b) => b.id - a.id);

    return list;
  }, [packages, q, sort, whMap]);

  const totalPackages = packages.length;
  const packed = packages.filter((p) => p.status === "spakovana").length;
  const sent = packages.filter((p) => p.status === "poslata").length;

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 18px 40px rgba(17, 24, 39, 0.12)",
    border: "1px solid rgba(0,0,0,0.06)",
    overflow: "hidden",
  };

  const topTabs: React.CSSProperties = {
    display: "flex",
    gap: 10,
    padding: 14,
    alignItems: "center",
    justifyContent: "space-between",
  };

  const tabBtn: React.CSSProperties = {
    display: "inline-flex",
    gap: 10,
    alignItems: "center",
    borderRadius: 999,
    padding: "8px 12px",
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    fontWeight: 700,
  };

  const headerBar: React.CSSProperties = {
    background: "#6D3CFF",
    color: "white",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 800,
    letterSpacing: 0.2,
  };

  const body: React.CSSProperties = { padding: 18 };

  const controlsRow: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 12,
  };

  const input: React.CSSProperties = {
    width: 340,
    maxWidth: "100%",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "10px 12px",
    outline: "none",
  };

  const select: React.CSSProperties = {
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "10px 12px",
    background: "#fff",
    fontWeight: 700,
  };

  const button: React.CSSProperties = {
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "10px 12px",
    background: "#13A05F",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  };

  const statPill: React.CSSProperties = {
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.16)",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
  };

  return (
    <div style={{ padding: 18 }}>
      <div style={card}>
        <div style={topTabs}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={tabBtn}>🏭 Servis skladištenja</button>
            <button style={{ ...tabBtn, opacity: 0.75 }}>📦 Ambalaže</button>
          </div>

          <button style={{ ...tabBtn, opacity: 0.85 }} onClick={() => window.history.back()}>
            ↩ Nazad na meni
          </button>
        </div>

        <div style={headerBar}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>📦</span>
            <span>Skladište i ambalaže</span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={statPill}>Ukupno: {totalPackages}</span>
            <span style={statPill}>Spakovano: {packed}</span>
            <span style={statPill}>Poslato: {sent}</span>
          </div>
        </div>

        <div style={body}>
          <div style={controlsRow}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button style={button} onClick={load} disabled={loading}>
                {loading ? "Učitavam..." : "Osveži"}
              </button>

              <input
                style={input}
                placeholder="Pretraga: ambalaža, skladište, status, parfemi..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />

              <select style={select} value={sort} onChange={(e) => setSort(e.target.value as any)}>
                <option value="novo">Sort: najnovije</option>
                <option value="naziv">Sort: naziv</option>
                <option value="status">Sort: status</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.9 }}>
              <span style={{ fontWeight: 800 }}>Skladišta: {warehouses.length}</span>
            </div>
          </div>

          {err && (
            <div
              style={{
                background: "#FFF1F2",
                border: "1px solid #FECDD3",
                color: "#9F1239",
                borderRadius: 12,
                padding: 12,
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              {err}
            </div>
          )}

          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "rgba(17,24,39,0.04)" }}>
                <tr>
                  {["Ambalaža", "Pošiljalac", "Skladište", "Parfemi (ID)", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 12px",
                        fontSize: 13,
                        letterSpacing: 0.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const w = whMap.get(p.warehouseId);
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <td style={{ padding: 12, fontWeight: 900 }}>{p.name}</td>
                      <td style={{ padding: 12 }}>{p.senderAddress}</td>
                      <td style={{ padding: 12 }}>
                        {w ? (
                          <div style={{ display: "grid" }}>
                            <span style={{ fontWeight: 900 }}>{w.name}</span>
                            <span style={{ opacity: 0.75, fontSize: 12 }}>{w.location}</span>
                          </div>
                        ) : (
                          <span style={{ opacity: 0.7 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: 12, fontFamily: "monospace" }}>
                        {p.perfumeIds?.length ? p.perfumeIds.join(", ") : "—"}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={pill(p.status)}>
                          {p.status === "poslata" ? "✅ Poslata" : "📦 Spakovana"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, opacity: 0.75 }}>
                      Nema rezultata za ovu pretragu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
