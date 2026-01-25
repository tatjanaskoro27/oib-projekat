import React, { useContext, useEffect, useMemo, useState } from "react";
import AuthContext from "../contexts/AuthContext";
import { ProcessingAPI } from "../api/processing/ProcessingAPI";
import type { PerfumeDTO } from "../models/processing/PerfumeDTO";
import type {
  BottleVolume,
  StartProcessingDTO,
  PerfumeType,
} from "../models/processing/StartProcessingDTO";
import type { ProcessingResultDTO } from "../models/processing/ProcessingResultDTO";

export const ProcessingPage: React.FC = () => {
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
  const [result, setResult] = useState<ProcessingResultDTO | null>(null);

  useEffect(() => {
    const load = async () => {
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
            "Greška pri učitavanju parfema.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, api]);

  const start = async () => {
    if (!token) return;

    setError(null);
    setResult(null);

    const selectedPerfume = perfumes.find((p) => p.id === perfumeId);

    if (!selectedPerfume) {
      setError("Izaberi parfem.");
      return;
    }
    if (!Number.isInteger(bottleCount) || bottleCount <= 0) {
      setError("Broj bočica mora biti ceo broj > 0.");
      return;
    }

    const dto: StartProcessingDTO = {
      perfumeName: selectedPerfume.name,
      perfumeType: perfumeType,
      bottleCount,
      bottleVolume,
    };

    try {
      setLoading(true);
      const res = await api.startProcessing(token, dto);
      setResult(res);
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
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div
        className="window"
        style={{ width: "1100px", maxWidth: "95%", margin: "30px auto" }}
      >
        <div className="window-content" style={{ padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Processing microservice</h2>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Izaberi parfem, broj bočica i neto zapreminu, pa pokreni preradu.
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minWidth: 260,
              }}
            >
              Parfem
              <select
                value={perfumeId}
                onChange={(e) => setPerfumeId(Number(e.target.value))}
                disabled={loading || perfumes.length === 0}
              >
                {perfumes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (#{p.id})
                  </option>
                ))}
              </select>
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minWidth: 180,
              }}
            >
              Broj bočica
              <input
                type="number"
                value={bottleCount}
                min={1}
                step={1}
                onChange={(e) => setBottleCount(Number(e.target.value))}
                disabled={loading}
              />
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minWidth: 180,
              }}
            >
              Neto zapremina
              <select
                value={bottleVolume}
                onChange={(e) =>
                  setBottleVolume(Number(e.target.value) as BottleVolume)
                }
                disabled={loading}
              >
                <option value={150}>150 ml</option>
                <option value={250}>250 ml</option>
              </select>
            </label>

            {/* Ako želiš da bude isto kao backend i za cologne, otkomentariši: */}
            {/* <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 180 }}>
              Tip parfema
              <select
                value={perfumeType}
                onChange={(e) => setPerfumeType(e.target.value as PerfumeType)}
                disabled={loading}
              >
                <option value="parfum">parfum</option>
                <option value="cologne">cologne</option>
              </select>
            </label> */}

            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                className="btn btn-accent"
                onClick={start}
                disabled={loading || perfumes.length === 0}
              >
                {loading ? "Radim..." : "Pokreni preradu"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, color: "crimson" }}>{error}</div>
          )}

          {result && (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ marginBottom: 10 }}>Rezultat</h3>
              <pre
                style={{
                  background: "rgba(0,0,0,0.15)",
                  padding: 12,
                  borderRadius: 10,
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
