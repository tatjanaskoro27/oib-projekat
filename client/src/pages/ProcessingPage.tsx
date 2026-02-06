import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";

import { ProcessingAPI } from "../api/processing/ProcessingAPI";
import { ProductionAPI } from "../api/production/ProductionAPI";

import type { PerfumeDTO } from "../models/processing/PerfumeDTO";
import type {
  BottleVolume,
  StartProcessingDTO,
  PerfumeType,
} from "../models/processing/StartProcessingDTO";
import type { ProcessingResultDTO } from "../models/processing/ProcessingResultDTO";
import type { PlantTypeSummaryDTO } from "../models/production/PlantTypeSummaryDTO";

/* ================= Helpers ================= */

const typeLabel = (t: PerfumeDTO["type"]): string => {
  if (t === "parfum") return "Parfem";
  return "Kolonjska voda";
};

const formatMl = (ml: number): string => `${ml} ml`;

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

// privremeni status
const statusLabel = (): string => "Skladišten";

/* ================= Styles ================= */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f6f7f8",
    padding: "22px 0",
  },

  window: {
    width: "1100px",
    maxWidth: "95%",
    margin: "0 auto",
    borderRadius: 18,
    background: "white",
    boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.06)",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,0.96))",
  },

  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "white",
    fontWeight: 800,
    cursor: "pointer",
  },

  tabActive: {
    border: "1px solid rgba(16, 185, 129, 0.45)",
    boxShadow: "0 6px 18px rgba(16,185,129,0.18)",
  },

  spacer: { flex: 1 },

  content: { padding: 18 },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 14,
    background: "rgba(16,185,129,0.10)",
    border: "1px solid rgba(16,185,129,0.25)",
  },

  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 18,
    fontWeight: 900,
    color: "#064e3b",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.85,
    color: "#065f46",
    fontWeight: 600,
  },

  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "white",
    border: "1px solid rgba(0,0,0,0.08)",
    fontWeight: 800,
  },

  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 14,
  },

  primaryBtn: {
    border: "none",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    background: "linear-gradient(180deg, #22c55e, #16a34a)",
    color: "white",
    boxShadow: "0 10px 20px rgba(16,185,129,0.22)",
  },

  secondaryBtn: {
    border: "1px solid rgba(0,0,0,0.10)",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 800,
    cursor: "pointer",
    background: "white",
  },

  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    background: "white",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontWeight: 800,
    fontSize: 13,
  },

  input: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "0 12px",
    outline: "none",
  },

  select: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "0 12px",
    outline: "none",
    background: "white",
  },

  hint: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(16,185,129,0.08)",
    border: "1px dashed rgba(16,185,129,0.35)",
    color: "#065f46",
    fontWeight: 800,
  },

  success: {
    marginTop: 12,
    padding: "10px 14px",
    borderRadius: 12,
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.30)",
    fontWeight: 900,
    color: "#065f46",
  },

  error: {
    marginTop: 12,
    padding: "10px 14px",
    borderRadius: 12,
    background: "rgba(220, 38, 38, 0.10)",
    border: "1px solid rgba(220, 38, 38, 0.25)",
    fontWeight: 800,
    color: "#991b1b",
  },

  tableWrap: {
    marginTop: 14,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.08)",
  },

  table: {
    width: "100%",
    tableLayout: "fixed",
    borderCollapse: "separate",
    borderSpacing: 0,
    background: "white",
  },

  th: {
    textAlign: "left",
    padding: "12px 12px",
    fontWeight: 900,
    fontSize: 13,
    background: "#fafafa",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
  },

  td: {
    padding: "12px 12px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontWeight: 700,
  },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.28)",
    color: "#065f46",
    fontWeight: 900,
    fontSize: 12,
  },

  footer: {
    marginTop: 10,
    opacity: 0.75,
    fontWeight: 700,
  },
};

/* ================= Component ================= */

export const ProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const api = useMemo(() => new ProcessingAPI(), []);
  const productionAPI = useMemo(() => new ProductionAPI(), []);

  const [perfumes, setPerfumes] = useState<PerfumeDTO[]>([]);

  // Start panel inputs
  const [plantTypes, setPlantTypes] = useState<PlantTypeSummaryDTO[]>([]);
  const [plantName, setPlantName] = useState<string>("");

  const [perfumeName, setPerfumeName] = useState<string>("");

  const [bottleCount, setBottleCount] = useState<number>(1);
  const [bottleVolume, setBottleVolume] = useState<BottleVolume>(150);

  const [perfumeType, setPerfumeType] = useState<PerfumeType>("parfum");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SUCCESS poruka
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [result, setResult] = useState<ProcessingResultDTO | null>(null);
  const [showStartPanel, setShowStartPanel] = useState(false);

  const loadPerfumes = async () => {
    if (!token) return;
    setError(null);

    try {
      setLoading(true);
      const data = await api.getPerfumes(token);
      setPerfumes(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Greška pri učitavanju parfema.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPlantTypes = async () => {
    if (!token) return;
    setError(null);

    try {
      const types = await productionAPI.getPlantTypes(token);
      setPlantTypes(types);

      // default: prva biljka
      if (types.length > 0) setPlantName(types[0].name);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Greška pri učitavanju vrsta biljaka.",
      );
    }
  };

  useEffect(() => {
    loadPerfumes();
    loadPlantTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const requiredMl = bottleCount * bottleVolume;
  const requiredPlants = Math.ceil(requiredMl / 50); // 1 biljka -> 50 ml parfema

  const startProcessing = async () => {
    if (!token) return;

    setError(null);
    setResult(null);

    if (!plantName || plantName.trim().length < 2) {
      setError("Izaberi biljku.");
      return;
    }

    if (!perfumeName || perfumeName.trim().length < 2) {
      setError("Unesi naziv parfema.");
      return;
    }

    if (!Number.isInteger(bottleCount) || bottleCount <= 0) {
      setError("Broj bočica mora biti cijeli broj veći od 0.");
      return;
    }

    const dto: StartProcessingDTO = {
      plantName: plantName.trim(),
      perfumeName: perfumeName.trim(),
      perfumeType,
      bottleCount,
      bottleVolume,
    };

    try {
      setLoading(true);

      const res = await api.startProcessing(token, dto);
      setResult(res);

      setSuccessMessage("Prerada uspješno završena");
      setTimeout(() => setSuccessMessage(null), 3000);

      setShowStartPanel(false);
      await loadPerfumes();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Greška pri pokretanju prerade.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.window}>
        {/* Top nav */}
        <div style={styles.topBar}>
          <button
            style={styles.tab}
            type="button"
            onClick={() => navigate("/production")}
          >
            🧪 Servis proizvodnje
          </button>

          <button
            style={{ ...styles.tab, ...styles.tabActive }}
            type="button"
            onClick={() => navigate("/processing")}
          >
            💧 Servis prerade
          </button>

          <div style={styles.spacer} />

          <button
            style={styles.secondaryBtn}
            onClick={() => navigate("/dashboard")}
          >
            ↩ Nazad na meni
          </button>
        </div>

        <div style={styles.content}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <div style={styles.headerTitle}>
                <span style={{ fontSize: 20 }}>💧</span>
                <span>Prerada biljaka u parfeme</span>
              </div>
              <div style={styles.headerSubtitle}>
                Pokreni preradu, pa proveri rezultate u tabeli.
              </div>
            </div>

            <div style={styles.pill}>
              Ukupno parfema: <b>{perfumes.length}</b>
            </div>
          </div>

          {/* Success / Error */}
          {successMessage && (
            <div style={styles.success}>✅ {successMessage}</div>
          )}
          {error && <div style={styles.error}>⚠️ {error}</div>}

          {/* Actions */}
          <div style={styles.actionRow}>
            <button
              style={styles.primaryBtn}
              onClick={() => setShowStartPanel((v) => !v)}
            >
              📦 Započni preradu
            </button>

            <button
              style={styles.secondaryBtn}
              onClick={loadPerfumes}
              disabled={loading}
            >
              {loading ? "Učitavam..." : "↻ Osveži"}
            </button>
          </div>

          {/* Start panel */}
          {showStartPanel && (
            <div style={styles.card}>
              <div style={styles.grid}>
                <label style={styles.field}>
                  Biljka (postojeće vrste)
                  <select
                    style={styles.select}
                    value={plantName}
                    onChange={(e) => setPlantName(e.target.value)}
                  >
                    {plantTypes.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.field}>
                  Naziv parfema
                  <input
                    style={styles.input}
                    type="text"
                    value={perfumeName}
                    onChange={(e) => setPerfumeName(e.target.value)}
                    placeholder="npr. Lavender Bliss"
                  />
                </label>

                <label style={styles.field}>
                  Tip
                  <select
                    style={styles.select}
                    value={perfumeType}
                    onChange={(e) =>
                      setPerfumeType(e.target.value as PerfumeType)
                    }
                  >
                    <option value="parfum">Parfem</option>
                    <option value="cologne">Kolonjska voda</option>
                  </select>
                </label>

                <label style={styles.field}>
                  Broj bočica
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    value={bottleCount}
                    onChange={(e) => setBottleCount(Number(e.target.value))}
                  />
                </label>

                <label style={styles.field}>
                  Neto zapremina
                  <select
                    style={styles.select}
                    value={bottleVolume}
                    onChange={(e) =>
                      setBottleVolume(Number(e.target.value) as BottleVolume)
                    }
                  >
                    <option value={150}>150 ml</option>
                    <option value={250}>250 ml</option>
                  </select>
                </label>

                <div />
              </div>

              <div style={styles.hint}>
                Potrebno: <b>{requiredMl}</b> ml → približno{" "}
                <b>{requiredPlants}</b> biljaka
              </div>

              <button
                style={{
                  ...styles.primaryBtn,
                  marginTop: 12,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onClick={startProcessing}
                disabled={loading}
              >
                {loading ? "Radim..." : "Pokreni"}
              </button>
            </div>
          )}

          {/* Table */}
          <div style={styles.tableWrap}>
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Naziv parfema</th>
                    <th style={styles.th}>Tip</th>
                    <th style={styles.th}>Zapremina</th>
                    <th style={styles.th}>Serijski broj</th>
                    <th style={styles.th}>Rok trajanja</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {perfumes.map((p) => (
                    <tr key={p.id}>
                      <td style={styles.td}>{p.name}</td>
                      <td style={styles.td}>{typeLabel(p.type)}</td>
                      <td style={styles.td}>{formatMl(p.netoMl)}</td>
                      <td style={styles.td}>{p.serialNumber}</td>
                      <td style={styles.td}>{formatDate(p.expiryDate)}</td>
                      <td style={styles.td}>
                        <span style={styles.statusPill}>{statusLabel()}</span>
                      </td>
                    </tr>
                  ))}

                  {perfumes.length === 0 && !loading && (
                    <tr>
                      <td style={{ ...styles.td, opacity: 0.7 }} colSpan={6}>
                        Nema parfema za prikaz.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.footer}>Ukupno parfema: {perfumes.length}</div>

          {/* result (ako ti treba kasnije za debug) */}
          {result && (
            <div style={{ marginTop: 12, opacity: 0.6, fontSize: 12 }}>
              {/* možeš ukloniti */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
