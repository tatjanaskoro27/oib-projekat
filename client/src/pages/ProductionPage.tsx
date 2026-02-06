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

const statusPillStyle = (
  label: "Posađena" | "Ubrana" | "Prerađena",
): React.CSSProperties => {
  const base: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.75)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 92,
    textAlign: "center",
    color: "rgba(0,0,0,0.82)",
    fontWeight: 900,
  };

  if (label === "Posađena")
    return {
      ...base,
      background: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.28)",
      color: "#065f46",
    };
  if (label === "Ubrana")
    return {
      ...base,
      background: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.28)",
      color: "#92400e",
    };
  return {
    ...base,
    background: "rgba(59,130,246,0.10)",
    border: "1px solid rgba(59,130,246,0.24)",
    color: "#1e40af",
  };
};

const logIcon = (t: TipDogadjaja): string => {
  if (t === "INFO") return "✅";
  if (t === "WARNING") return "⚠️";
  return "❌";
};

const eventCardStyle = (t: TipDogadjaja): React.CSSProperties => {
  const base: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: 12,
    padding: "10px 10px",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
  };

  if (t === "WARNING") {
    return {
      ...base,
      background: "rgba(245,158,11,0.08)",
      border: "1px solid rgba(245,158,11,0.18)",
    };
  }
  if (t === "ERROR") {
    return {
      ...base,
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.18)",
    };
  }
  return {
    ...base,
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.18)",
  };
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
      existing.strengthAvg =
        (existing.strengthAvg * existing.qty + strength) / newQty;
      existing.qty = newQty;
      existing.ids.push(p.id);
    }
  }

  const order = (s: PlantStatus): number =>
    s === PlantStatus.PLANTED ? 0 : s === PlantStatus.HARVESTED ? 1 : 2;

  return Array.from(map.values()).sort((a, b) => {
    const od = order(a.status) - order(b.status);
    if (od !== 0) return od;
    return a.name.localeCompare(b.name);
  });
};

const flatPlantsToRows = (plants: PlantDTO[]): PlantRowFlat[] => {
  const order = (s: PlantStatus): number =>
    s === PlantStatus.PLANTED ? 0 : s === PlantStatus.HARVESTED ? 1 : 2;

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

/* -------------- Minimal UI styles -------------- */

const ui: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f6f7f8",
    padding: 18,
    boxSizing: "border-box",
  },
  shell: {
    width: "100%",
    height: "calc(100vh - 36px)",
    background: "white",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: 18,
    boxShadow: "0 12px 42px rgba(0,0,0,0.10)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 14px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    background: "linear-gradient(180deg, #ffffff, rgba(255,255,255,0.94))",
  },

  tab: {
    border: "1px solid rgba(0,0,0,0.08)",
    background: "white",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  tabActive: {
    border: "1px solid rgba(34,197,94,0.42)",
    background: "rgba(34,197,94,0.10)",
    boxShadow: "0 8px 22px rgba(34,197,94,0.18)",
  },

  content: { padding: 14, flex: 1, minHeight: 0 },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 380px",
    gap: 12,
    height: "100%",
    minHeight: 0,
  },

  card: {
    background: "white",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
    overflow: "hidden",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },

  cardHeader: {
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    background: "rgba(255,255,255,0.96)",
    fontWeight: 900,
    color: "rgba(0,0,0,0.86)",
  },

  btnPrimary: {
    border: "none",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
    color: "white",
    background: "linear-gradient(180deg, #22c55e, #16a34a)",
    boxShadow: "0 10px 22px rgba(34,197,94,0.22)",
  },

  btnGhost: {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
    background: "white",
  },

  toolbar: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    background: "rgba(0,0,0,0.02)",
    border: "1px solid rgba(0,0,0,0.06)",
  },

  input: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "0 12px",
    outline: "none",
    background: "white",
  },

  tableWrap: {
    padding: "0 12px 12px 12px",
    flex: 1,
    minHeight: 0,
  },

  tableBox: {
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "white",
  },

  th: {
    textAlign: "left",
    padding: 12,
    fontSize: 13,
    fontWeight: 900,
    color: "rgba(0,0,0,0.78)",
    background: "#fafafa",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
  },

  td: {
    padding: 12,
    borderTop: "1px solid rgba(0,0,0,0.06)",
    color: "rgba(0,0,0,0.82)",
    fontWeight: 700,
  },

  toast: {
    marginBottom: 12,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(34,197,94,0.28)",
    background: "rgba(34,197,94,0.12)",
    fontWeight: 900,
    color: "#065f46",
  },

  err: {
    marginTop: 10,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.22)",
    background: "rgba(239,68,68,0.10)",
    fontWeight: 900,
    color: "#991b1b",
  },
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

  const [plantTypes, setPlantTypes] = useState<PlantTypeSummaryDTO[]>([]);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [selectedGroupedIndex, setSelectedGroupedIndex] = useState<
    number | null
  >(null);
  const [selectedFlatIndex, setSelectedFlatIndex] = useState<number | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [plantsError, setPlantsError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlantStatus>("all");
  const [sortBy, setSortBy] = useState<GetPlantsQueryDTO["sortBy"]>("name");
  const [sortDir, setSortDir] = useState<GetPlantsQueryDTO["sortDir"]>("ASC");

  const [viewMode, setViewMode] = useState<"grouped" | "all">("grouped");

  const [showPlantPanel, setShowPlantPanel] = useState(false);
  const [showStrengthPanel, setShowStrengthPanel] = useState(false);

  const [plantMode, setPlantMode] = useState<"existing" | "new">("existing");
  const [selectedTypeName, setSelectedTypeName] = useState<string>("");

  const [typeSearch, setTypeSearch] = useState<string>("");

  const [plantName, setPlantName] = useState("");
  const [latinName, setLatinName] = useState("");
  const [originCountry, setOriginCountry] = useState("");

  const [oilStrengthInput, setOilStrengthInput] = useState<string>("");

  const [percent, setPercent] = useState<number>(100);

  const selectedType = useMemo(
    () => plantTypes.find((t) => t.name === selectedTypeName) ?? null,
    [plantTypes, selectedTypeName],
  );

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
      const msg =
        e instanceof Error ? e.message : "Greška pri učitavanju biljaka.";
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
      const msg =
        e instanceof Error ? e.message : "Greška pri učitavanju događaja.";
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
      const msg =
        e instanceof Error ? e.message : "Greška pri učitavanju vrsta biljaka.";
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

  const selectedGrouped =
    selectedGroupedIndex !== null ? groupedRows[selectedGroupedIndex] : null;
  const selectedFlat =
    selectedFlatIndex !== null ? flatRows[selectedFlatIndex] : null;

  const disabledAction = false;

  /* ---------------- Actions ---------------- */

  const handleCreatePlant = async () => {
    if (!token) return;

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
      const msg =
        e?.response?.data?.message || e?.message || "Greška pri sadnji biljke.";
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
      await Promise.all(
        ids.map((id) => productionAPI.updateOilStrength(token, id, dto)),
      );
      showToast(`Jačina uspješno promijenjena (× ${p}%)`);
      setShowStrengthPanel(false);
      await loadAll();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Greška pri promjeni jačine.";
      setPlantsError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={ui.page}>
      <div style={ui.shell}>
        {/* Top bar */}
        <div style={ui.topBar}>
          <button
            type="button"
            style={{ ...ui.tab, ...ui.tabActive }}
            onClick={() => navigate("/production")}
          >
            🌿 Servis proizvodnje
          </button>

          <button
            type="button"
            style={ui.tab}
            onClick={() => navigate("/processing")}
          >
            💧 Servis prerade
          </button>

          <div style={{ flex: 1 }} />

          <button
            type="button"
            style={ui.btnGhost}
            onClick={() => navigate("/dashboard")}
          >
            ← Nazad na meni
          </button>
        </div>

        <div style={ui.content}>
          {toast && <div style={ui.toast}>✅ {toast}</div>}

          <div style={ui.grid}>
            {/* LEFT */}
            <div style={ui.card}>
              <div style={ui.cardHeader}>
                <span>Upravljanje biljkama</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={ui.btnGhost}
                    onClick={() => void loadAll()}
                  >
                    ⟳ Osveži
                  </button>
                </div>
              </div>

              <div style={ui.toolbar}>
                <div style={ui.filters}>
                  <input
                    style={{ ...ui.input, flex: "1 1 280px", minWidth: 240 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pretraga (naziv / latin / zemlja)…"
                  />

                  <select
                    style={{ ...ui.input, flex: "0 0 160px", minWidth: 150 }}
                    value={statusFilter}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "all") setStatusFilter("all");
                      else if (v === PlantStatus.PLANTED)
                        setStatusFilter(PlantStatus.PLANTED);
                      else if (v === PlantStatus.HARVESTED)
                        setStatusFilter(PlantStatus.HARVESTED);
                      else setStatusFilter(PlantStatus.PROCESSED);
                    }}
                  >
                    <option value="all">Sva stanja</option>
                    <option value={PlantStatus.PLANTED}>Posađena</option>
                    <option value={PlantStatus.HARVESTED}>Ubrana</option>
                    <option value={PlantStatus.PROCESSED}>Prerađena</option>
                  </select>

                  <select
                    style={{ ...ui.input, flex: "0 0 160px", minWidth: 150 }}
                    value={sortBy ?? "name"}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      if (
                        v === "createdAt" ||
                        v === "oilStrength" ||
                        v === "name"
                      )
                        setSortBy(v);
                    }}
                  >
                    <option value="name">Sort: naziv</option>
                    <option value="oilStrength">Sort: jačina</option>
                  </select>

                  <select
                    style={{ ...ui.input, flex: "0 0 120px", minWidth: 120 }}
                    value={sortDir ?? "ASC"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "ASC" || v === "DESC") setSortDir(v);
                    }}
                  >
                    <option value="ASC">ASC</option>
                    <option value="DESC">DESC</option>
                  </select>

                  <button
                    type="button"
                    style={ui.btnGhost}
                    onClick={() => void loadAll()}
                  >
                    Primijeni
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    style={ui.btnPrimary}
                    disabled={disabledAction}
                    onClick={() => setShowPlantPanel((v) => !v)}
                  >
                    + Zasadi biljku
                  </button>

                  <button
                    type="button"
                    style={ui.btnGhost}
                    disabled={disabledAction}
                    onClick={() => setShowStrengthPanel((v) => !v)}
                  >
                    Promijeni jačinu
                  </button>

                  <div style={{ flex: 1 }} />

                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Prikaz:</span>
                    <button
                      type="button"
                      style={{
                        ...ui.btnGhost,
                        padding: "8px 10px",
                        opacity: viewMode === "grouped" ? 1 : 0.75,
                      }}
                      onClick={() => {
                        setViewMode("grouped");
                        setSelectedFlatIndex(null);
                      }}
                    >
                      Grupisano
                    </button>
                    <button
                      type="button"
                      style={{
                        ...ui.btnGhost,
                        padding: "8px 10px",
                        opacity: viewMode === "all" ? 1 : 0.75,
                      }}
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
                      ...ui.filters,
                      background: "rgba(34,197,94,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 900, width: "100%" }}>
                      Zasadi biljku
                    </div>

                    {typesError && (
                      <div style={ui.err}>Greška (vrste): {typesError}</div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        width: "100%",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          checked={plantMode === "existing"}
                          onChange={() => setPlantMode("existing")}
                        />
                        Postojeća vrsta
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          checked={plantMode === "new"}
                          onChange={() => setPlantMode("new")}
                        />
                        Nova vrsta
                      </label>
                      <div style={{ flex: 1 }} />
                      <button
                        type="button"
                        style={ui.btnGhost}
                        onClick={() => void loadPlantTypes()}
                      >
                        ⟳ Vrste
                      </button>
                    </div>

                    {plantMode === "existing" && (
                      <div
                        style={{
                          width: "100%",
                          display: "grid",
                          gridTemplateColumns: "minmax(320px, 1fr) 240px auto",
                          gap: 10,
                          alignItems: "end",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <input
                            style={ui.input}
                            value={typeSearch}
                            onChange={(e) => setTypeSearch(e.target.value)}
                            placeholder="Pretraga vrste (lavanda / lavandula / francuska)…"
                          />

                          <div
                            style={{
                              border: "1px solid rgba(0,0,0,0.08)",
                              borderRadius: 12,
                              padding: 10,
                              background: "white",
                              maxHeight: 220,
                              overflow: "auto",
                            }}
                          >
                            {filteredTypes.length === 0 ? (
                              <div style={{ opacity: 0.75 }}>
                                Nema rezultata.
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 10,
                                }}
                              >
                                {filteredTypes.map((t) => (
                                  <label
                                    key={t.name}
                                    style={{
                                      display: "flex",
                                      gap: 10,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      checked={selectedTypeName === t.name}
                                      onChange={() =>
                                        setSelectedTypeName(t.name)
                                      }
                                    />
                                    <div style={{ lineHeight: 1.25 }}>
                                      <div style={{ fontWeight: 900 }}>
                                        {t.name}
                                      </div>
                                      <div
                                        style={{
                                          opacity: 0.8,
                                          fontStyle: "italic",
                                          fontSize: 12,
                                        }}
                                      >
                                        {t.latinName}
                                      </div>
                                      <div
                                        style={{ opacity: 0.75, fontSize: 12 }}
                                      >
                                        {t.originCountry}
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <label
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            fontWeight: 900,
                            fontSize: 13,
                          }}
                        >
                          Jačina (opciono)
                          <input
                            style={ui.input}
                            type="number"
                            step="0.01"
                            min={1}
                            max={5}
                            value={oilStrengthInput}
                            onChange={(e) =>
                              setOilStrengthInput(e.target.value)
                            }
                            placeholder="prazno = random"
                          />
                        </label>

                        <button
                          type="button"
                          style={ui.btnPrimary}
                          onClick={() => void handleCreatePlant()}
                          disabled={isLoading || plantTypes.length === 0}
                        >
                          {isLoading ? "..." : "Zasadi"}
                        </button>
                      </div>
                    )}

                    {plantMode === "new" && (
                      <div
                        style={{
                          width: "100%",
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr 240px auto",
                          gap: 10,
                          alignItems: "end",
                        }}
                      >
                        <input
                          style={ui.input}
                          value={plantName}
                          onChange={(e) => setPlantName(e.target.value)}
                          placeholder="Opšti naziv *"
                        />
                        <input
                          style={ui.input}
                          value={latinName}
                          onChange={(e) => setLatinName(e.target.value)}
                          placeholder="Latinski naziv *"
                        />
                        <input
                          style={ui.input}
                          value={originCountry}
                          onChange={(e) => setOriginCountry(e.target.value)}
                          placeholder="Zemlja porijekla *"
                        />

                        <input
                          style={ui.input}
                          type="number"
                          step="0.01"
                          min={1}
                          max={5}
                          value={oilStrengthInput}
                          onChange={(e) => setOilStrengthInput(e.target.value)}
                          placeholder="Jačina (opciono)"
                        />

                        <button
                          type="button"
                          style={ui.btnPrimary}
                          onClick={() => void handleCreatePlant()}
                          disabled={isLoading}
                        >
                          {isLoading ? "..." : "Zasadi"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Panel: Jačina */}
                {showStrengthPanel && (
                  <div style={ui.filters}>
                    <div style={{ fontWeight: 900, width: "100%" }}>
                      Promijeni jačinu ulja (%)
                    </div>

                    <input
                      style={{ ...ui.input, width: 220 }}
                      type="number"
                      min={0}
                      max={100}
                      value={percent}
                      onChange={(e) => setPercent(Number(e.target.value))}
                      placeholder="0–100"
                    />

                    <div style={{ fontSize: 12, opacity: 0.75, flex: 1 }}>
                      Primjenjuje se na selektovanu biljku (Sve biljke) ili na
                      grupu (Grupisano).
                    </div>

                    <button
                      type="button"
                      style={ui.btnGhost}
                      onClick={() => void handleUpdateStrength()}
                      disabled={isLoading}
                    >
                      {isLoading ? "..." : "Primijeni"}
                    </button>
                  </div>
                )}

                {isLoading && <div style={{ opacity: 0.75 }}>Učitavam…</div>}
                {plantsError && <div style={ui.err}>Greška: {plantsError}</div>}
              </div>

              {/* Table */}
              <div style={ui.tableWrap}>
                <div style={ui.tableBox}>
                  <div style={{ height: "100%", overflow: "auto" }}>
                    {viewMode === "grouped" ? (
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr>
                            <th style={ui.th}>Naziv</th>
                            <th style={ui.th}>Latinski naziv</th>
                            <th style={{ ...ui.th, textAlign: "right" }}>
                              Jačina (avg)
                            </th>
                            <th style={{ ...ui.th, textAlign: "right" }}>
                              Količina
                            </th>
                            <th style={{ ...ui.th, textAlign: "center" }}>
                              Stanje
                            </th>
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
                                  background: isSel
                                    ? "rgba(34,197,94,0.08)"
                                    : "transparent",
                                }}
                              >
                                <td style={{ ...ui.td, fontWeight: 900 }}>
                                  {r.name}
                                </td>
                                <td
                                  style={{
                                    ...ui.td,
                                    opacity: 0.85,
                                    fontStyle: "italic",
                                  }}
                                >
                                  {r.latinName}
                                </td>
                                <td
                                  style={{
                                    ...ui.td,
                                    textAlign: "right",
                                    fontWeight: 900,
                                  }}
                                >
                                  {Number(r.strengthAvg).toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    ...ui.td,
                                    textAlign: "right",
                                    fontWeight: 900,
                                  }}
                                >
                                  {r.qty}
                                </td>
                                <td style={{ ...ui.td, textAlign: "center" }}>
                                  <span style={statusPillStyle(r.statusLabel)}>
                                    {r.statusLabel}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {!isLoading && groupedRows.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                style={{ padding: 14, opacity: 0.75 }}
                              >
                                Nema podataka.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr>
                            <th style={ui.th}>ID</th>
                            <th style={ui.th}>Naziv</th>
                            <th style={ui.th}>Latinski naziv</th>
                            <th style={{ ...ui.th, textAlign: "right" }}>
                              Jačina
                            </th>
                            <th style={{ ...ui.th, textAlign: "center" }}>
                              Stanje
                            </th>
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
                                  background: isSel
                                    ? "rgba(34,197,94,0.08)"
                                    : "transparent",
                                }}
                              >
                                <td
                                  style={{
                                    ...ui.td,
                                    fontWeight: 900,
                                    opacity: 0.9,
                                  }}
                                >
                                  {r.id}
                                </td>
                                <td style={{ ...ui.td, fontWeight: 900 }}>
                                  {r.name}
                                </td>
                                <td
                                  style={{
                                    ...ui.td,
                                    opacity: 0.85,
                                    fontStyle: "italic",
                                  }}
                                >
                                  {r.latinName}
                                </td>
                                <td
                                  style={{
                                    ...ui.td,
                                    textAlign: "right",
                                    fontWeight: 900,
                                  }}
                                >
                                  {Number(r.strength).toFixed(2)}
                                </td>
                                <td style={{ ...ui.td, textAlign: "center" }}>
                                  <span style={statusPillStyle(r.statusLabel)}>
                                    {r.statusLabel}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {!isLoading && flatRows.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                style={{ padding: 14, opacity: 0.75 }}
                              >
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
            <div style={ui.card}>
              <div style={ui.cardHeader}>
                <span>Dnevnik proizvodnje</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ opacity: 0.7, fontSize: 12 }}>
                    Ukupno: {rawDogadjaji.length}
                  </span>
                  <button
                    type="button"
                    style={ui.btnGhost}
                    onClick={() => void loadDogadjaji()}
                  >
                    ⟳
                  </button>
                </div>
              </div>

              {eventsError && <div style={ui.err}>Greška: {eventsError}</div>}

              <div
                style={{
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  overflow: "auto",
                  minHeight: 0,
                }}
              >
                {rawDogadjaji.slice(0, 50).map((d) => (
                  <div key={d.id} style={eventCardStyle(d.tip)}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 12 }}>
                        {logIcon(d.tip)}
                      </div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>
                        {hhmm(d.datumVreme)}
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        opacity: 0.92,
                        fontWeight: 700,
                        fontSize: 12,
                        color: "rgba(0,0,0,0.82)",
                      }}
                    >
                      {d.opis}
                    </div>
                  </div>
                ))}

                {rawDogadjaji.length === 0 && (
                  <div style={{ opacity: 0.75 }}>Nema događaja.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
