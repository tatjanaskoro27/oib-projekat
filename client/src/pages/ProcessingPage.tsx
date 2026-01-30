import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";

import { ProcessingAPI } from "../api/processing/ProcessingAPI";
import type { PerfumeDTO } from "../models/processing/PerfumeDTO";
import type {
  BottleVolume,
  StartProcessingDTO,
  PerfumeType,
} from "../models/processing/StartProcessingDTO";
import type { ProcessingResultDTO } from "../models/processing/ProcessingResultDTO";

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

/* ================= Component ================= */

export const ProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const api = useMemo(() => new ProcessingAPI(), []);

  const [perfumes, setPerfumes] = useState<PerfumeDTO[]>([]);
  const [perfumeId, setPerfumeId] = useState<number>(0);

  const [bottleCount, setBottleCount] = useState<number>(1);
  const [bottleVolume, setBottleVolume] = useState<BottleVolume>(150);
  const perfumeType: PerfumeType = "parfum";

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
      if (data.length > 0) setPerfumeId(data[0].id);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Greška pri učitavanju parfema."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerfumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const startProcessing = async () => {
    if (!token) return;

    setError(null);
    setResult(null);

    const selected = perfumes.find((p) => p.id === perfumeId);
    if (!selected) {
      setError("Izaberi parfem.");
      return;
    }

    if (!Number.isInteger(bottleCount) || bottleCount <= 0) {
      setError("Broj bočica mora biti cijeli broj veći od 0.");
      return;
    }

    const dto: StartProcessingDTO = {
      perfumeName: selected.name,
      perfumeType,
      bottleCount,
      bottleVolume,
    };

    try {
      setLoading(true);

      const res = await api.startProcessing(token, dto);
      setResult(res);

      // 🔔 SUCCESS poruka
      setSuccessMessage("Prerada uspješno završena");

      // sakrij poruku nakon 3 sekunde
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // zatvori panel
      setShowStartPanel(false);

      // osvježi listu parfema → novi se pojave u tabeli
      await loadPerfumes();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Greška pri pokretanju prerade."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div
        className="window"
        style={{ width: "1100px", maxWidth: "95%", margin: "30px auto" }}
      >
        <div className="window-content" style={{ padding: 0 }}>
          {/* ===== Tabs ===== */}
          <div className="ms-tabs">
            <button
              className="ms-tab"
              type="button"
              onClick={() => navigate("/production")}
            >
              🧪 Servis proizvodnje
            </button>

            <button className="ms-tab active" type="button">
              💧 Servis prerade
            </button>

            <div style={{ flex: 1 }} />

            <button
              className="btn btn-standard"
              onClick={() => navigate("/dashboard")}
            >
              ↩ Nazad na meni
            </button>
          </div>

          {/* ===== Header ===== */}
          <div className="section-header-purple">
            <div className="section-header-title">
              <span className="section-header-icon">💧</span>
              <span>Prerada biljaka u parfeme</span>
            </div>
          </div>

          <div style={{ padding: 18 }}>
            {/* SUCCESS message */}
            {successMessage && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(0, 200, 120, 0.15)",
                  border: "1px solid rgba(0, 200, 120, 0.4)",
                  fontWeight: 700,
                }}
              >
                ✅ {successMessage}
              </div>
            )}

            {/* ===== Action bar ===== */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn btn-accent"
                onClick={() => setShowStartPanel((v) => !v)}
              >
                📦 Započni preradu
              </button>

              <div className="ms-pill">
                Ukupno parfema: <b>{perfumes.length}</b>
              </div>
            </div>

            {/* ===== Start panel ===== */}
            {showStartPanel && (
              <div className="card" style={{ marginTop: 14, padding: 16 }}>
                <label>
                  Parfem
                  <select
                    value={perfumeId}
                    onChange={(e) =>
                      setPerfumeId(Number(e.target.value))
                    }
                  >
                    {perfumes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Broj bočica
                  <input
                    type="number"
                    min={1}
                    value={bottleCount}
                    onChange={(e) =>
                      setBottleCount(Number(e.target.value))
                    }
                  />
                </label>

                <label>
                  Neto zapremina
                  <select
                    value={bottleVolume}
                    onChange={(e) =>
                      setBottleVolume(
                        Number(e.target.value) as BottleVolume
                      )
                    }
                  >
                    <option value={150}>150 ml</option>
                    <option value={250}>250 ml</option>
                  </select>
                </label>

                <button
                  className="btn btn-accent"
                  onClick={startProcessing}
                  disabled={loading}
                >
                  {loading ? "Radim..." : "Pokreni"}
                </button>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 12, color: "crimson" }}>
                {error}
              </div>
            )}

            {/* ===== Table ===== */}
            <div
              style={{
                marginTop: 14,
                maxHeight: "380px",
                overflowY: "auto",
                borderRadius: 12,
              }}
            >
              <table
                className="win-table"
                style={{
                  width: "100%",
                  tableLayout: "fixed",
                }}
              >

                <thead>
                  <tr>
                    <th>Naziv parfema</th>
                    <th>Tip</th>
                    <th>Zapremina</th>
                    <th>Serijski broj</th>
                    <th>Rok trajanja</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {perfumes.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{typeLabel(p.type)}</td>
                      <td>{formatMl(p.netoMl)}</td>
                      <td>{p.serialNumber}</td>
                      <td>{formatDate(p.expiryDate)}</td>
                      <td>
                        <span className="status-pill status-stored">
                          {statusLabel()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 8, opacity: 0.8 }}>
              Ukupno parfema: {perfumes.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
