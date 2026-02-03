import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuthHook";

import { ProductionAPI } from "../api/production/ProductionAPI";
import { DogadjajiAPI } from "../api/dogadjaji/DogadjajiAPI";
import { IDogadjajiAPI } from "../api/dogadjaji/IDogadjajiAPI";

import { PlantDTO } from "../models/production/PlantDTO";
import { PlantStatus } from "../enums/PlantStatus";
import { GetPlantsQueryDTO } from "../models/production/GetPlantsQueryDTO";

import { DogadjajDTO } from "../models/dogadjaji/DogadjajDTO";
import { TipDogadjaja } from "../models/dogadjaji/TipDogadjaja";

import { CreatePlantDTO } from "../models/production/CreatePlantDTO";
import { UpdateOilStrengthDTO } from "../models/production/UpdateOilStrengthDTO";
import { PlantTypeSummaryDTO } from "../models/production/PlantTypeSummaryDTO";

/* ---------------- Types ---------------- */

type PlantRowGrouped = {
  key: string;
  name: string;
  latinName: string;
  strengthAvg: number;
  qty: number;
  status: PlantStatus;
  statusLabel: "Posađena" | "Ubrana" | "Prerađena";
  ids: number[];
};

type PlantRowFlat = {
  id: number;
  name: string;
  latinName: string;
  strength: number;
  status: PlantStatus;
  statusLabel: "Posađena" | "Ubrana" | "Prerađena";
};

/* -------------- Helpers --------------- */

const toNumber = (v: string | number): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const statusLabelOf = (s: PlantStatus): "Posađena" | "Ubrana" | "Prerađena" => {
  if (s === PlantStatus.PLANTED) return "Posađena";
  if (s === PlantStatus.HARVESTED) return "Ubrana";
  return "Prerađena";
};

const statusPillStyle = (label: "Posađena" | "Ubrana" | "Prerađena"): React.CSSProperties => {
  const base: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.75)",
    display: "inline-block",
    minWidth: 86,
    textAlign: "center",
    color: "rgba(0,0,0,0.82)",
    fontWeight: 700,
  };

  if (label === "Posađena") return { ...base, background: "rgba(47,163,107,0.16)", border: "1px solid rgba(47,163,107,0.30)" };
  if (label === "Ubrana") return { ...base, background: "rgba(255,165,0,0.14)", border: "1px solid rgba(255,165,0,0.30)" };
  return { ...base, background: "rgba(96,205,255,0.18)", border: "1px solid rgba(96,205,255,0.30)" };
};

const logIcon = (t: TipDogadjaja): string => {
  if (t === "INFO") return "✅";
  if (t === "WARNING") return "⚠️";
  return "❌";
};

const eventCardStyle = (t: TipDogadjaja): React.CSSProperties => {
  const base: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: 8,
    padding: "6px 8px",
    background: "rgba(255,255,255,0.85)",
    boxShadow: "none",
  };

  if (t === "WARNING") {
    return { ...base, background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.18)" };
  }
  if (t === "ERROR") {
    return { ...base, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.18)" };
  }
  return { ...base, background: "rgba(47,163,107,0.08)", border: "1px solid rgba(47,163,107,0.18)" };
};


const hhmm = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const groupPlantsToRows = (plants: PlantDTO[]): PlantRowGrouped[] => {
  const map = new Map<string, PlantRowGrouped>();

  for (const p of plants) {
    const strength = toNumber(p.oilStrength);
    const key = `${p.name}__${p.status}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        key,
        name: p.name,
        latinName: p.latinName,
        strengthAvg: strength,
        qty: 1,
        status: p.status,
        statusLabel: statusLabelOf(p.status),
        ids: [p.id],
      });
    } else {
      const newQty = existing.qty + 1;
      existing.strengthAvg = (existing.strengthAvg * existing.qty + strength) / newQty;
      existing.qty = newQty;
      existing.ids.push(p.id);
    }
  }

  const order = (s: PlantStatus): number => (s === PlantStatus.PLANTED ? 0 : s === PlantStatus.HARVESTED ? 1 : 2);

  return Array.from(map.values()).sort((a, b) => {
    const od = order(a.status) - order(b.status);
    if (od !== 0) return od;
    return a.name.localeCompare(b.name);
  });
};

const flatPlantsToRows = (plants: PlantDTO[]): PlantRowFlat[] => {
  const order = (s: PlantStatus): number => (s === PlantStatus.PLANTED ? 0 : s === PlantStatus.HARVESTED ? 1 : 2);

  return plants
    .map((p) => ({
      id: p.id,
      name: p.name,
      latinName: p.latinName,
      strength: toNumber(p.oilStrength),
      status: p.status,
      statusLabel: statusLabelOf(p.status),
    }))
    .sort((a, b) => {
      const od = order(a.status) - order(b.status);
      if (od !== 0) return od;
      return a.name.localeCompare(b.name);
    });
};

const sortDogadjajiNewestFirst = (items: DogadjajDTO[]): DogadjajDTO[] => {
  return [...items].sort((a, b) => {
    const ta = new Date(a.datumVreme).getTime();
    const tb = new Date(b.datumVreme).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
};

/* -------------- Component -------------- */

export const ProductionPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const productionAPI = useMemo(() => new ProductionAPI(), []);
  const dogadjajiAPI: IDogadjajiAPI = useMemo(() => new DogadjajiAPI(), []);

  const [rawPlants, setRawPlants] = useState<PlantDTO[]>([]);
  const [groupedRows, setGroupedRows] = useState<PlantRowGrouped[]>([]);
  const [flatRows, setFlatRows] = useState<PlantRowFlat[]>([]);

  const [rawDogadjaji, setRawDogadjaji] = useState<DogadjajDTO[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Plant types (postojeće vrste)
  const [plantTypes, setPlantTypes] = useState<PlantTypeSummaryDTO[]>([]);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [selectedGroupedIndex, setSelectedGroupedIndex] = useState<number | null>(null);
  const [selectedFlatIndex, setSelectedFlatIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [plantsError, setPlantsError] = useState<string | null>(null);

  // toast poruka (3s)
  const [toast, setToast] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlantStatus>("all");
  const [sortBy, setSortBy] = useState<GetPlantsQueryDTO["sortBy"]>("name");
  const [sortDir, setSortDir] = useState<GetPlantsQueryDTO["sortDir"]>("ASC");

  // View mode
  const [viewMode, setViewMode] = useState<"grouped" | "all">("grouped");

  // Panels (Plant + Strength)
  const [showPlantPanel, setShowPlantPanel] = useState(false);
  const [showStrengthPanel, setShowStrengthPanel] = useState(false);

  // Plant form
  const [plantMode, setPlantMode] = useState<"existing" | "new">("existing");
  const [selectedTypeName, setSelectedTypeName] = useState<string>("");

  // pretraga vrsta (za scroll listu)
  const [typeSearch, setTypeSearch] = useState<string>("");

  // Nova vrsta (ručni unos)
  const [plantName, setPlantName] = useState("");
  const [latinName, setLatinName] = useState("");
  const [originCountry, setOriginCountry] = useState("");

  // Jačina ulja (opciono): prazno => random 1.00–5.00 na backendu
  const [oilStrengthInput, setOilStrengthInput] = useState<string>("");

  // Strength form (percent multiplier)
  const [percent, setPercent] = useState<number>(100);

  const selectedType = useMemo(() => plantTypes.find((t) => t.name === selectedTypeName) ?? null, [plantTypes, selectedTypeName]);

  const filteredTypes = useMemo(() => {
    const q = typeSearch.trim().toLowerCase();
    if (!q) return plantTypes;
    return plantTypes.filter((t) => {
      return (
        t.name.toLowerCase().includes(q) ||
        t.latinName.toLowerCase().includes(q) ||
        t.originCountry.toLowerCase().includes(q)
      );
    });
  }, [plantTypes, typeSearch]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadPlants = async (): Promise<void> => {
    if (!token) return;

    setIsLoading(true);
    setPlantsError(null);

    try {
      const query: GetPlantsQueryDTO = {
        search: search.trim() ? search.trim() : undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        sortBy: sortBy ?? undefined,
        sortDir: sortDir ?? undefined,
      };

      const plants = await productionAPI.getPlants(token, query);

      setRawPlants(plants);
      setGroupedRows(groupPlantsToRows(plants));
      setFlatRows(flatPlantsToRows(plants));
      setSelectedGroupedIndex(null);
      setSelectedFlatIndex(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Greška pri učitavanju biljaka.";
      setPlantsError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDogadjaji = async (): Promise<void> => {
    if (!token) return;

    setEventsError(null);

    try {
      const events = await dogadjajiAPI.getDogadjaji(token);
      setRawDogadjaji(sortDogadjajiNewestFirst(events));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Greška pri učitavanju događaja.";
      setEventsError(msg);
    }
  };

  const loadPlantTypes = async (): Promise<void> => {
    if (!token) return;

    setTypesError(null);

    try {
      const types = await productionAPI.getPlantTypes(token);
      setPlantTypes(types);

      if (!selectedTypeName && types.length > 0) {
        setSelectedTypeName(types[0].name);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Greška pri učitavanju vrsta biljaka.";
      setTypesError(msg);
    }
  };

  const loadAll = async (): Promise<void> => {
    await Promise.all([loadPlants(), loadDogadjaji(), loadPlantTypes()]);
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => {
      void loadDogadjaji();
    }, 10000);
    return () => window.clearInterval(id);
  }, [token]);

  const selectedGrouped = selectedGroupedIndex !== null ? groupedRows[selectedGroupedIndex] : null;
  const selectedFlat = selectedFlatIndex !== null ? flatRows[selectedFlatIndex] : null;

  // ✅ akcije su omogućene
  const disabledAction = false;

  /* ---------------- Actions ---------------- */

  const handleCreatePlant = async () => {
    if (!token) return;

    // Jačina ulja: prazno => backend random (1.00–5.00)
    const strengthRaw = oilStrengthInput.trim();
    const strength = strengthRaw ? Number(strengthRaw) : undefined;

    if (strengthRaw) {
      if (!Number.isFinite(strength)) {
        showToast("Jačina ulja mora biti broj (1.00–5.00) ili ostavi prazno.");
        return;
      }
      if (strength! < 1 || strength! > 5) {
        showToast("Jačina ulja mora biti između 1.00 i 5.00.");
        return;
      }
    }

    let dto: CreatePlantDTO;

    if (plantMode === "existing") {
      const picked = plantTypes.find((t) => t.name === selectedTypeName);
      if (!picked) {
        showToast("Odaberi postojeću vrstu.");
        return;
      }

      dto = {
        name: picked.name,
        latinName: picked.latinName,
        originCountry: picked.originCountry,
        oilStrength: strength,
      };
    } else {
      const name = plantName.trim();
      const ln = latinName.trim();
      const oc = originCountry.trim();

      if (name.length < 2) {
        showToast("Opšti naziv mora imati bar 2 slova.");
        return;
      }
      if (ln.length < 3) {
        showToast("Latinski naziv mora imati bar 3 znaka.");
        return;
      }
      if (oc.length < 2) {
        showToast("Zemlja porijekla je obavezna.");
        return;
      }

      dto = {
        name,
        latinName: ln,
        originCountry: oc,
        oilStrength: strength,
      };
    }

    try {
      setIsLoading(true);
      await productionAPI.createPlant(token, dto);
      showToast("Biljka uspješno zasađena");
      setShowPlantPanel(false);
      setPlantName("");
      setLatinName("");
      setOriginCountry("");
      setOilStrengthInput("");
      setTypeSearch("");
      await loadAll();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Greška pri sadnji biljke.";
      setPlantsError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStrength = async () => {
    if (!token) return;

    const p = Number(percent);

    if (!Number.isFinite(p)) {
      showToast("Jačina (percent) mora biti broj.");
      return;
    }

    if (p < 0 || p > 100) {
      showToast("Jačina mora biti između 0 i 100.");
      return;
    }

    let ids: number[] = [];

    if (viewMode === "grouped" && selectedGrouped) ids = selectedGrouped.ids;
    if (viewMode === "all" && selectedFlat) ids = [selectedFlat.id];

    if (ids.length === 0) {
      showToast("Selektuj biljku (ili grupu) pa promijeni jačinu.");
      return;
    }

    const dto: UpdateOilStrengthDTO = { percent: p };

    try {
      setIsLoading(true);
      await Promise.all(ids.map((id) => productionAPI.updateOilStrength(token, id, dto)));
      showToast(`Jačina uspješno promijenjena (× ${p}%)`);
      setShowStrengthPanel(false);
      await loadAll();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Greška pri promjeni jačine.";
      setPlantsError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-fill" style={{ width: "100%", height: "100vh" }}>
      {/* window full-screen */}
      <div
        className="window"
        style={{
          width: "100%",
          height: "100%",
          margin: 0,
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          maxWidth: "none",
          maxHeight: "none",
        }}
      >
        {/* Top tabs + back */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 12px 0 12px",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="btn-standard"
              style={{ padding: "8px 12px" }}
              onClick={() => navigate("/production")}
            >
              🌿 Servis proizvodnje
            </button>
            <button
              type="button"
              className="btn-standard"
              style={{ padding: "8px 12px", opacity: 0.85 }}
              onClick={() => navigate("/processing")}
            >
              🧪 Servis prerade
            </button>
          </div>

          <div style={{ flex: 1 }} />

          <button
            type="button"
            className="btn-standard"
            style={{ padding: "8px 12px" }}
            onClick={() => navigate("/dashboard")}
          >
            ← Nazad na meni
          </button>
        </div>

        {/* Content */}
        <div
          className="window-content"
          style={{
            padding: 12,
            flex: 1,
            boxSizing: "border-box",
            minHeight: 0,
            background: "transparent",
          }}
        >
          {/* toast */}
          {toast && (
            <div
              style={{
                marginBottom: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(47,163,107,0.35)",
                background: "rgba(47,163,107,0.12)",
                fontWeight: 800,
                color: "rgba(0,0,0,0.82)",
              }}
            >
              ✅ {toast}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 360px",
              gap: 12,
              height: "100%",
              minHeight: 0,
            }}
          >
            {/* LEFT */}
            <div
              className="acrylic"
              style={{
                borderRadius: 16,
                overflow: "visible", // IMPORTANT (da se ništa ne odsiječe)
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: "rgba(255,255,255,0.92)",
                  padding: "12px 14px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  color: "rgba(0,0,0,0.86)",
                }}
              >
                <span>Upravljanje biljkama</span>
                <button
                  type="button"
                  className="btn-standard"
                  style={{ padding: "6px 10px" }}
                  onClick={() => void loadAll()}
                >
                  ⟳ Osveži
                </button>
              </div>

              {/* Toolbar */}
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                    padding: 10,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >


                  <input
                    className="input"
                    style={{ flex: "1 1 280px", minWidth: 240 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pretraga (naziv / latin / zemlja)…"
                  />


                  <select
                    className="input"
                    style={{ flex: "0 0 160px", minWidth: 140 }}

                    value={statusFilter}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "all") setStatusFilter("all");
                      else if (v === PlantStatus.PLANTED) setStatusFilter(PlantStatus.PLANTED);
                      else if (v === PlantStatus.HARVESTED) setStatusFilter(PlantStatus.HARVESTED);
                      else setStatusFilter(PlantStatus.PROCESSED);
                    }}
                  >
                    <option value="all">Sva stanja</option>
                    <option value={PlantStatus.PLANTED}>Posađena</option>
                    <option value={PlantStatus.HARVESTED}>Ubrana</option>
                    <option value={PlantStatus.PROCESSED}>Prerađena</option>
                  </select>

                  <select
                    className="input"
                    style={{ flex: "0 0 160px", minWidth: 140 }}

                    value={sortBy ?? "createdAt"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "createdAt" || v === "oilStrength" || v === "name") setSortBy(v);
                    }}
                  >
                    <option value="oilStrength">Sort: jačina</option>
                    <option value="name">Sort: naziv</option>
                  </select>

                  <select
                    className="input"
                    style={{ flex: "0 0 160px", minWidth: 140 }}

                    value={sortDir ?? "DESC"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "ASC" || v === "DESC") setSortDir(v);
                    }}
                  >
                    <option value="DESC">DESC</option>
                    <option value="ASC">ASC</option>
                  </select>

                  <button
                    type="button"
                    className="btn-standard"
                    style={{ height: 34, padding: "0 12px", fontWeight: 600 }}
                    onClick={() => void loadAll()}
                  >
                    Primijeni filtere
                  </button>

                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-accent"
                    disabled={disabledAction}
                    onClick={() => setShowPlantPanel((v) => !v)}
                  >
                    + Zasadi biljku
                  </button>

                  <button
                    type="button"
                    className="btn-standard"
                    disabled={disabledAction}
                    onClick={() => setShowStrengthPanel((v) => !v)}
                  >
                    Promijeni jačinu
                  </button>

                  <div style={{ flex: 1 }} />

                  <div style={{ display: "flex", gap: 6, alignItems: "center", opacity: 0.95 }}>
                    <span style={{ fontSize: 12, opacity: 0.75, color: "rgba(0,0,0,0.75)" }}>Prikaz:</span>
                    <button
                      type="button"
                      className="btn-standard"
                      style={{ padding: "6px 10px", opacity: viewMode === "grouped" ? 1 : 0.75 }}
                      onClick={() => {
                        setViewMode("grouped");
                        setSelectedFlatIndex(null);
                      }}
                    >
                      Grupisano
                    </button>
                    <button
                      type="button"
                      className="btn-standard"
                      style={{ padding: "6px 10px", opacity: viewMode === "all" ? 1 : 0.75 }}
                      onClick={() => {
                        setViewMode("all");
                        setSelectedGroupedIndex(null);
                      }}
                    >
                      Sve biljke
                    </button>
                  </div>
                </div>

                {/* Panel: Zasadi */}
                {showPlantPanel && (
                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 12,
                      padding: 12,
                      background: "rgba(255,255,255,0.85)",
                      color: "rgba(0,0,0,0.85)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>Zasadi biljku</div>
                      <button type="button" className="btn-standard" style={{ padding: "6px 10px" }} onClick={() => void loadPlantTypes()}>
                        ⟳ Vrste
                      </button>
                    </div>

                    {typesError && <div style={{ marginBottom: 10, color: "#b00020", fontWeight: 700 }}>Greška (vrste): {typesError}</div>}

                    {/* MODE */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input type="radio" checked={plantMode === "existing"} onChange={() => setPlantMode("existing")} />
                        Postojeća vrsta
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input type="radio" checked={plantMode === "new"} onChange={() => setPlantMode("new")} />
                        Nova vrsta (ručni unos)
                      </label>
                    </div>

                    {plantMode === "existing" && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(380px, 1fr) 260px auto",
                          gap: 10,
                          alignItems: "end",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            Pretraga vrste
                            <input
                              className="input"
                              value={typeSearch}
                              onChange={(e) => setTypeSearch(e.target.value)}
                              placeholder="npr. lavanda / lavandula / francuska"
                            />
                          </label>

                          <div
                            style={{
                              border: "1px solid rgba(0,0,0,0.08)",
                              borderRadius: 10,
                              padding: 10,
                              background: "rgba(255,255,255,0.92)",
                              maxHeight: 220,
                              overflow: "auto",
                            }}
                          >
                            <div style={{ fontWeight: 900, marginBottom: 8, opacity: 0.9 }}>Dostupne vrste</div>

                            {filteredTypes.length === 0 ? (
                              <div style={{ opacity: 0.75 }}>Nema rezultata za unos.</div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {filteredTypes.map((t) => (
                                  <label key={t.name} style={{ display: "flex", gap: 10, cursor: "pointer" }}>
                                    <input
                                      type="radio"
                                      checked={selectedTypeName === t.name}
                                      onChange={() => setSelectedTypeName(t.name)}
                                    />
                                    <div style={{ lineHeight: 1.25 }}>
                                      <div style={{ fontWeight: 900 }}>{t.name}</div>
                                      <div style={{ opacity: 0.85, fontStyle: "italic", fontSize: 12 }}>{t.latinName}</div>
                                      <div style={{ opacity: 0.8, fontSize: 12 }}>{t.originCountry}</div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.35 }}>
                            {selectedType ? (
                              <>
                                Odabrano: <b>{selectedType.name}</b> — <span style={{ fontStyle: "italic" }}>{selectedType.latinName}</span>, {selectedType.originCountry}
                              </>
                            ) : (
                              <>Odaberi jednu vrstu iz liste.</>
                            )}
                          </div>
                        </div>

                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          Jačina ulja (opciono)
                          <input
                            className="input"
                            type="number"
                            step="0.01"
                            min={1}
                            max={5}
                            value={oilStrengthInput}
                            onChange={(e) => setOilStrengthInput(e.target.value)}
                            placeholder="prazno = random 1.00–5.00"
                          />
                        </label>

                        <button type="button" className="btn-accent" onClick={() => void handleCreatePlant()} disabled={isLoading || plantTypes.length === 0}>
                          {isLoading ? "..." : "Zasadi biljku"}
                        </button>
                      </div>
                    )}

                    {plantMode === "new" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 260px auto", gap: 10, alignItems: "end" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          Opšti naziv *
                          <input className="input" value={plantName} onChange={(e) => setPlantName(e.target.value)} placeholder="npr. Lavanda" />
                        </label>

                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          Latinski naziv *
                          <input className="input" value={latinName} onChange={(e) => setLatinName(e.target.value)} placeholder="npr. Lavandula angustifolia" />
                        </label>

                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          Zemlja porijekla *
                          <input className="input" value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} placeholder="npr. Francuska" />
                        </label>

                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          Jačina ulja (opciono)
                          <input
                            className="input"
                            type="number"
                            step="0.01"
                            min={1}
                            max={5}
                            value={oilStrengthInput}
                            onChange={(e) => setOilStrengthInput(e.target.value)}
                            placeholder="prazno = random 1.00–5.00"
                          />
                        </label>

                        <button type="button" className="btn-accent" onClick={() => void handleCreatePlant()} disabled={isLoading}>
                          {isLoading ? "..." : "Zasadi biljku"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Panel: Jačina */}
                {showStrengthPanel && (
                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 12,
                      padding: 12,
                      background: "rgba(255,255,255,0.85)",
                      color: "rgba(0,0,0,0.85)",
                    }}
                  >
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Promijeni jačinu ulja za željeni procenat</div>

                    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr auto", gap: 10, alignItems: "end" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        Procenat (0–100)
                        <input className="input" type="number" min={0} max={100} value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
                      </label>

                      <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                        Primjenjuje se na selektovanu biljku (u “Sve biljke”) ili na sve u selektovanoj grupi (u “Grupisano”).
                      </div>

                      <button type="button" className="btn-standard" onClick={() => void handleUpdateStrength()} disabled={isLoading}>
                        {isLoading ? "..." : "Primijeni"}
                      </button>
                    </div>
                  </div>
                )}

                {isLoading && <div style={{ opacity: 0.8, color: "rgba(0,0,0,0.75)" }}>Učitavam…</div>}
                {plantsError && <div style={{ color: "#b00020", fontWeight: 700 }}>Greška: {plantsError}</div>}
              </div>

              {/* Table area (scroll) */}
              <div style={{ padding: "0 12px 12px 12px", flex: 1, minHeight: 0 }}>
                <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, overflow: "hidden", height: "100%", background: "rgba(255,255,255,0.85)" }}>
                  <div style={{ height: "100%", overflow: "auto" }}>
                    {viewMode === "grouped" ? (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "rgba(255,255,255,0.92)", position: "sticky", top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>Naziv</th>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>Latinski naziv</th>
                            <th style={{ textAlign: "right", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>Jačina (avg)</th>
                            <th style={{ textAlign: "right", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>Količina</th>
                            <th style={{ textAlign: "center", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>Stanje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedRows.map((r, i) => {
                            const isSel = i === selectedGroupedIndex;
                            return (
                              <tr
                                key={r.key}
                                onClick={() => setSelectedGroupedIndex(i)}
                                style={{
                                  cursor: "pointer",
                                  background: isSel ? "rgba(96,205,255,0.14)" : "transparent",
                                }}
                              >
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.82)", fontWeight: 700 }}>{r.name}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", opacity: 0.85, fontStyle: "italic", color: "rgba(0,0,0,0.78)" }}>
                                  {r.latinName}
                                </td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "right", color: r.strengthAvg > 4 ? "#b00020" : "rgba(0,0,0,0.82)", fontWeight: 800 }}>
                                  {Number(r.strengthAvg).toFixed(2)}
                                </td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "right", color: "rgba(0,0,0,0.82)", fontWeight: 800 }}>{r.qty}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
                                  <span style={statusPillStyle(r.statusLabel)}>{r.statusLabel}</span>
                                </td>
                              </tr>
                            );
                          })}

                          {!isLoading && groupedRows.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ padding: 12, opacity: 0.75, color: "rgba(0,0,0,0.75)" }}>
                                Nema podataka.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "rgba(255,255,255,0.92)", position: "sticky", top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>ID</th>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>Naziv</th>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>Latinski naziv</th>
                            <th style={{ textAlign: "right", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>Jačina</th>
                            <th style={{ textAlign: "center", padding: 10, fontSize: 13, color: "rgba(0,0,0,0.8)" }}>Stanje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flatRows.map((r, i) => {
                            const isSel = i === selectedFlatIndex;
                            return (
                              <tr
                                key={r.id}
                                onClick={() => setSelectedFlatIndex(i)}
                                style={{
                                  cursor: "pointer",
                                  background: isSel ? "rgba(96,205,255,0.14)" : "transparent",
                                }}
                              >
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", opacity: 0.9, color: "rgba(0,0,0,0.82)", fontWeight: 800 }}>{r.id}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.82)", fontWeight: 700 }}>{r.name}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", opacity: 0.85, fontStyle: "italic", color: "rgba(0,0,0,0.78)" }}>
                                  {r.latinName}
                                </td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "right", color: r.strength > 4 ? "#b00020" : "rgba(0,0,0,0.82)", fontWeight: 800 }}>
                                  {Number(r.strength).toFixed(2)}
                                </td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
                                  <span style={statusPillStyle(r.statusLabel)}>{r.statusLabel}</span>
                                </td>
                              </tr>
                            );
                          })}

                          {!isLoading && flatRows.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ padding: 12, opacity: 0.75, color: "rgba(0,0,0,0.75)" }}>
                                Nema podataka.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT - Events */}
            <div className="acrylic" style={{ borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.92)",
                  padding: "12px 14px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  color: "rgba(0,0,0,0.86)",
                }}
              >
                <span>Dnevnik proizvodnje</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ opacity: 0.75, fontSize: 12 }}>Ukupno: {rawDogadjaji.length}</span>
                  <button type="button" className="btn-standard" style={{ padding: "6px 10px" }} onClick={() => void loadDogadjaji()}>
                    ⟳
                  </button>
                </div>
              </div>

              {eventsError && <div style={{ padding: 12, color: "#b00020", fontWeight: 700 }}>Greška: {eventsError}</div>}

              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6, overflow: "auto", minHeight: 0 }}>
                {rawDogadjaji.slice(0, 50).map((d) => (
                  <div key={d.id} style={eventCardStyle(d.tip)}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{logIcon(d.tip)}</div>
                      <div style={{ opacity: 0.70, fontSize: 11, color: "rgba(0,0,0,0.70)" }}>{hhmm(d.datumVreme)}</div>
                    </div>
                    <div style={{ marginTop: 4, opacity: 0.90, fontWeight: 500, fontSize: 12, color: "rgba(0,0,0,0.82)" }}>
                      {d.opis}
                    </div>
                  </div>
                ))}


                {rawDogadjaji.length === 0 && <div style={{ opacity: 0.75, color: "rgba(0,0,0,0.75)" }}>Nema događaja.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
