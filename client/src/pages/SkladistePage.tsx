import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";

type WarehouseDTO = {
  id: number;
  naziv: string;
  lokacija: string;
  maksimalanBrojAmbalaza: number;
};

type PackageItemDTO = {
  perfumeId: string;
  naziv: string;
};

type PackageDTO = {
  id: number;
  naziv: string;
  adresaPosiljaoca: string;
  status: "SPAKOVANA" | "POSLATA" | "USKLADISTENA" | "ISPORUCENA";
  skladiste: WarehouseDTO | null;

  // ✅ NOVO: realne stavke iz baze (TypeORM relations)
  stavke?: PackageItemDTO[];
};


const GATEWAY_BASE = import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:4000";

const shell: React.CSSProperties = {
  padding: 16,
  maxWidth: 1250,
  margin: "0 auto",
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.96)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 14,
  boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
};

const inputBase: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  outline: "none",
  background: "rgba(255,255,255,0.95)",
};




function statusOrder(s: PackageDTO["status"]) {
  if (s === "SPAKOVANA") return 1;
  if (s === "USKLADISTENA") return 2;
  if (s === "POSLATA") return 3;
  return 4; // ISPORUCENA
}

function statusLabel(s: PackageDTO["status"]) {
  if (s === "SPAKOVANA" || s === "USKLADISTENA") return "Spakovana";
  return "Poslata";
}

function statusPill(status: PackageDTO["status"]) {
  const base: React.CSSProperties = {
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    letterSpacing: 0.3,
  };

  const green = status === "ISPORUCENA" || status === "POSLATA";

  return green
    ? {
        ...base,
        background: "rgba(18,185,90,0.12)",
        color: "#0F7A3D",
        border: "1px solid rgba(18,185,90,0.25)",
      }
    : {
        ...base,
        background: "rgba(255,170,0,0.14)",
        color: "#8A5A00",
        border: "1px solid rgba(255,170,0,0.30)",
      };
}

// ✅ kapacitet kao na slici: SVE ambalaze u skladistu / maksimalanBrojAmbalaza
function usedInWarehouse(all: PackageDTO[], warehouseId: number) {
  return all.filter((p) => p.skladiste?.id === warehouseId).length;
}

function pct(used: number, cap: number) {
  if (!cap || cap <= 0) return 0;
  return Math.max(0, Math.min(100, (used / cap) * 100));
}

export default function SkladistePage() {
  const auth = useContext(AuthContext);
  const token = auth?.token || "";
  const navigate = useNavigate();

  async function fetchWarehouses(): Promise<WarehouseDTO[]> {
    const r = await fetch(`${GATEWAY_BASE}/skladiste/skladista?t=${Date.now()}`, {
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
    const r = await fetch(`${GATEWAY_BASE}/skladiste/ambalaze?t=${Date.now()}`, {
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

  const [brojAmbalaza, setBrojAmbalaza] = useState<number>(1);
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [wh, pk] = await Promise.all([fetchWarehouses(), fetchPackages()]);
      setWarehouses(wh);
      setPackages(pk);
    } catch (e: any) {
      setErr(e?.message || "Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function sendPackages() {
    try {
      setSending(true);
      setErr(null);

      const n = Math.max(1, Math.floor(Number(brojAmbalaza || 1)));

      const r = await fetch(`${GATEWAY_BASE}/skladiste/send`, {
        method: "POST",
        headers: {
          Authorization: token ? "Bearer " + token : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brojAmbalaza: n }),
      });

      const data = await r.json().catch(() => ({}));

      if (r.status === 401) throw new Error("Nisi ulogovana (401). Uloguj se ponovo.");
      if (r.status === 403) throw new Error("Nemaš pravo pristupa (403). Proveri ulogu.");
      if (!r.ok) throw new Error(data?.message || "Neuspešno slanje ambalaža.");

      await load();
    } catch (e: any) {
      setErr(e?.message || "Greška pri slanju.");
    } finally {
      setSending(false);
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    let list = packages.filter((p) => {
      const whText = p.skladiste ? `${p.skladiste.naziv} ${p.skladiste.lokacija}` : "";
      const itemsText = Array.isArray(p.stavke)
  ? p.stavke.map((s) => `${s.naziv} ${s.perfumeId}`).join(" ")
  : "";

      const txt = `${p.naziv} ${p.adresaPosiljaoca} ${p.status} ${whText} ${itemsText}`;
      return txt.toLowerCase().includes(needle);

    });

    if (sort === "naziv") {
      list = [...list].sort((a, b) =>
        a.naziv.localeCompare(b.naziv, "sr", { sensitivity: "base" }),
      );
    }
    if (sort === "status") {
      list = [...list].sort(
        (a, b) => statusOrder(a.status) - statusOrder(b.status) || b.id - a.id,
      );
    }
    if (sort === "novo") {
      list = [...list].sort((a, b) => b.id - a.id);
    }

    return list;
  }, [packages, q, sort]);

  const total = packages.length;

  // ✅ “u skladistu” = USKLADISTENA/SPAKOVANA
  const uskladistena = packages.filter(
    (p) => p.status === "SPAKOVANA" || p.status === "USKLADISTENA",
  ).length;

  // ✅ “poslate” = POSLATA/ISPORUCENA
  const isporucena = packages.filter(
    (p) => p.status === "POSLATA" || p.status === "ISPORUCENA",
  ).length;

  return (
    <div style={shell}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Skladište</h2>
          <div style={{ opacity: 0.75, marginTop: 4, fontSize: 13 }}>
            Pregled skladišta i ambalaža (naziv parfema × količina)
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" onClick={() => navigate("/dashboard")}>
            Nazad
          </button>
          <button onClick={load} disabled={loading} className="btn btn-primary">
            {loading ? "Učitavam..." : "Osveži"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pretraga (ambalaža, pošiljalac, parfemi, status, skladište...)"
          style={{ ...inputBase, flex: 1, minWidth: 260 }}
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          style={{ ...inputBase, minWidth: 220 }}
        >
          <option value="novo">Sort: najnovije</option>
          <option value="naziv">Sort: naziv</option>
          <option value="status">Sort: status</option>
        </select>

        <div style={{ marginLeft: "auto", opacity: 0.85, fontWeight: 800 }}>
          Skladišta: {warehouses.length}
        </div>
      </div>

      {/* Counters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ ...card, padding: 14 }}>
          <div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>
            Ukupno ambalaža
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>{total}</div>
        </div>

        <div style={{ ...card, padding: 14 }}>
          <div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>
            U skladištu
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>{uskladistena}</div>
        </div>

        <div style={{ ...card, padding: 14 }}>
          <div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>
            Poslate ambalaže
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>{isporucena}</div>
        </div>
      </div>

      {err && (
        <div style={{ marginBottom: 12, color: "crimson", fontWeight: 800 }}>
          {err}
        </div>
      )}

      {/* 2 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1.4fr",
          gap: 12,
          alignItems: "start",
        }}
      >
        {/* Left: Warehouses */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: 12,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255,120,0,0.12)",
            }}
          >
            <div style={{ fontWeight: 900 }}>Skladišta</div>
          </div>

          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {warehouses.map((w) => {
              const used = usedInWarehouse(packages, w.id);
              const cap = Number(w.maksimalanBrojAmbalaza || 0);
              const percent = pct(used, cap);

              return (
                <div
                  key={w.id}
                  style={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 12,
                    padding: 14,
                    background: "rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>{w.naziv}</div>
                      <div style={{ opacity: 0.75, fontSize: 13 }}>{w.lokacija}</div>
                      <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12, fontWeight: 800 }}>
                        Kapacitet:
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>
                        {used} / {cap || "—"}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        height: 10,
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.12)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "100%",
                          background: "rgba(18,185,90,0.75)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        opacity: 0.75,
                        textAlign: "right",
                        fontWeight: 700,
                      }}
                    >
                      {percent.toFixed(1)}% popunjeno
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Packages table */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: 12,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(140,80,255,0.14)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 900 }}>Ambalaže u skladištu</div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="number"
                min={1}
                value={brojAmbalaza}
                onChange={(e) => setBrojAmbalaza(Math.max(1, Number(e.target.value || 1)))}
                style={{ ...inputBase, width: 110 }}
              />
              <button className="btn btn-primary" onClick={sendPackages} disabled={sending || loading}>
                {sending ? "Šaljem..." : "Pošalji"}
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead style={{ background: "rgba(0,0,0,0.03)" }}>
                <tr>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>ID</th>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Ambalaža</th>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Pošiljalac</th>
                  <th style={{ textAlign: "right", padding: 12, fontSize: 12, opacity: 0.8 }}>Broj parfema</th>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Skladište</th>
                  <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, color: "#666" }}>
                      Nema rezultata za ovu pretragu.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const wh = p.skladiste ? `${p.skladiste.naziv} (${p.skladiste.lokacija})` : "—";
                    const totalPerfumes = Array.isArray(p.stavke) ? p.stavke.length : 0;


                    return (
                      <tr key={p.id} style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                        <td
                          style={{
                            padding: 12,
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                            fontSize: 12,
                          }}
                        >
                          {p.id}
                        </td>
                        <td style={{ padding: 12, fontWeight: 900 }}>{p.naziv}</td>
                        <td style={{ padding: 12 }}>{p.adresaPosiljaoca}</td>
                        <td style={{ padding: 12, textAlign: "right", fontWeight: 900 }}>{totalPerfumes}</td>
                        <td style={{ padding: 12, opacity: 0.9 }}>{wh}</td>
                        <td style={{ padding: 12 }}>
                          <span style={statusPill(p.status)}>{statusLabel(p.status)}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
