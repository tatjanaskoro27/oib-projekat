import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import { SalesAPI } from "../api/sales/SalesAPI";
import type { SalesPerfumeDTO } from "../models/sales/SalesPerfumeDTO";
import type { PurchaseRequestDTO } from "../models/sales/PurchaseDTO";

type CartItem = {
  perfume: SalesPerfumeDTO;
  quantity: number;
};

export const SalesPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const navigate = useNavigate();
  const api = useMemo(() => new SalesAPI(), []);

  const [perfumes, setPerfumes] = useState<SalesPerfumeDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastItems, setLastItems] = useState<{ naziv: string; kol: number; cena: number }[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] =
    useState<PurchaseRequestDTO["saleType"]>("MALOPRODAJA");
  const [paymentType, setPaymentType] =
    useState<PurchaseRequestDTO["paymentType"]>("GOTOVINA");

  const [receipt, setReceipt] = useState<any | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  function getUserIdFromJwt(tok: string): number | null {
    try {
      const payload = tok.split(".")[1];
      const json = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
      );
      const id = json.id ?? json.userId ?? json.sub;
      const num = Number(id);
      return Number.isFinite(num) ? num : null;
    } catch {
      return null;
    }
  }

  const userId = token ? getUserIdFromJwt(token) : null;

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
          e?.response?.data?.error ||
          e?.message ||
          "Greška pri učitavanju kataloga.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerfumes();
  
  }, [token]);

  const addToCart = (p: SalesPerfumeDTO) => {
    setReceipt(null);
    setError(null);
    setQrCode(null);

    if (p.stock <= 0) {
      setError("Ovaj parfem trenutno nije dostupan.");
      return;
    }
      

    setCart((prev) => {
      const existing = prev.find((x) => x.perfume.id === p.id);
      if (!existing) return [...prev, { perfume: p, quantity: 1 }];

      return prev.map((x) =>
        x.perfume.id === p.id
          ? { ...x, quantity: Math.min(x.quantity + 1, p.stock) }
          : x,
      );
    });
  };

  const updateQty = (perfumeId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((x) =>
          x.perfume.id === perfumeId
            ? { ...x, quantity: Math.max(1, Math.min(qty, x.perfume.stock)) }
            : x,
        )
        .filter((x) => x.quantity > 0),
    );
  };

  const removeFromCart = (perfumeId: string) => {
    setCart((prev) => prev.filter((x) => x.perfume.id !== perfumeId));
  };

  const total = cart.reduce(
    (sum, x) => sum + Number(x.perfume.price) * x.quantity,
    0,
  );

  const purchase = async () => {
  if (!token) return;

  setError(null);
  setReceipt(null);
  setQrCode(null);

  if (!userId) {
    setError("Ne mogu da odredim userId iz tokena.");
    return;
  }
  if (cart.length === 0) {
    setError("Korpa je prazna.");
    return;
  }

  const items = cart.map((x) => ({
  name: x.perfume.name,
  quantity: x.quantity,
})) as any;


  const dto: PurchaseRequestDTO = {
    userId,
    items,
    saleType,
    paymentType,
  };

  try {
    setLoading(true);

    const res: any = await api.purchase(token, dto);

   
    const last = cart.map((x) => ({
      naziv: x.perfume.name,
      kol: x.quantity,
      cena: Number(x.perfume.price),
    }));
    setLastItems(last);    
    setReceipt(res?.racun ?? null);
    
    setQrCode(res?.qrCode ?? null);
    setCart([]);

    const fresh = await api.getPerfumes(token);
    setPerfumes(fresh);
  } catch (err: any) {
    setError(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Greška pri kupovini.",
    );
  } finally {
    setLoading(false);
  }
};

  const r = receipt?.racun ?? receipt;

  const receiptItems: any[] = Array.isArray(r?.stavke)
    ? r.stavke
    : Array.isArray(r?.items)
      ? r.items
      : [];

  const receiptTotal =
    Number(
      r?.ukupnoZaNaplatu ??
        r?.ukupno ??
        r?.iznos ??
        r?.totalAmount ??
        r?.total ??
        NaN,
    );

  const calcTotalFromItems = receiptItems.reduce((sum, s) => {
    const kol = Number(s?.kolicina ?? s?.quantity ?? 0);
    const cena = Number(s?.cenaPoKomadu ?? s?.cena ?? s?.price ?? 0);
    const line =
      (Number.isFinite(kol) ? kol : 0) * (Number.isFinite(cena) ? cena : 0);
    return sum + line;
  }, 0);

  const totalToShow = Number.isFinite(receiptTotal)
    ? receiptTotal
    : Number(calcTotalFromItems);

return (
  <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
    <div
      className="window"
      style={{
        width: "1320px",
        maxWidth: "98%",
        margin: "20px auto",
      }}
    >
      <div
        className="window-content"
        style={{
          padding: 22,
          maxHeight: "calc(100vh - 40px)", 
          overflowY: "auto",
          paddingRight: 16,
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn"
              onClick={() => navigate("/skladiste")}
              disabled={loading}
              style={{
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 900,
              }}
              title="Otvori skladište"
            >
              📦 Skladište
            </button>

            <button
              className="btn btn-accent"
              onClick={() => navigate("/sales")}
              disabled={loading}
              style={{
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 900,
              }}
              title="Prodaja"
            >
              🛒 Prodaja
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              className="btn"
              onClick={loadPerfumes}
              disabled={loading || !token}
              style={{ borderRadius: 12, padding: "10px 14px", fontWeight: 900 }}
              title="Osveži katalog"
            >
              🔄 Osveži
            </button>

            <button
              className="btn"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
              style={{ borderRadius: 12, padding: "10px 14px", fontWeight: 900 }}
            >
              ↩ Nazad na meni
            </button>
          </div>
        </div>

        {/* INFO */}
        <div
          style={{
            borderRadius: 16,
            background: "rgba(40,167,69,0.10)",
            border: "1px solid rgba(40,167,69,0.18)",
            padding: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>🛒 Prodaja parfema</div>
              <div style={{ opacity: 0.75, marginTop: 4, fontSize: 13 }}>
                Dodaj parfeme u korpu, izaberi tip prodaje i način plaćanja, pa izvrši kupovinu.
              </div>
            </div>

            <div
              style={{
                alignSelf: "center",
                padding: "8px 12px",
                borderRadius: 999,
                fontWeight: 900,
                background: "rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
                whiteSpace: "nowrap",
              }}
            >
              Ukupno parfema: {perfumes.length}
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 12,
            alignItems: "end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 240 }}>
              Tip prodaje
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value as PurchaseRequestDTO["saleType"])}
                disabled={loading}
                style={{ borderRadius: 12, padding: "10px 12px" }}
              >
                <option value="MALOPRODAJA">MALOPRODAJA</option>
                <option value="VELEPRODAJA">VELEPRODAJA</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 240 }}>
              Način plaćanja
              <select
                value={paymentType}
                onChange={(e) =>
                  setPaymentType(e.target.value as PurchaseRequestDTO["paymentType"])
                }
                disabled={loading}
                style={{ borderRadius: 12, padding: "10px 12px" }}
              >
                {/*  vrednosti usklađene sa DTO */}
                <option value="GOTOVINA">GOTOVINA</option>
                <option value="UPLATA_NA_RACUN">UPLATA_NA_RACUN</option>
                <option value="KARTICNO_PLACANJE">KARTICNO_PLACANJE</option>
              </select>
            </label>
          </div>
        </div>

        {error && <div style={{ marginTop: 12, color: "crimson", fontWeight: 700 }}>{error}</div>}

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(560px, 1.6fr) minmax(440px, 1fr)",
            gap: 16,
            marginTop: 14,
            alignItems: "start",
          }}
        >
          {/* KATALOG */}
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(255,255,255,0.95)",
              overflow: "hidden",
              boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                background: "rgba(18,185,90,0.12)",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                fontWeight: 900,
              }}
            >
              <div>🧾 Katalog</div>
              <div style={{ fontSize: 12.5, opacity: 0.8 }}>
                {loading ? "Učitavam..." : `Ukupno: ${perfumes.length}`}
              </div>
            </div>

            <div style={{ padding: 12 }}>
              <div
                style={{
                  maxHeight: "calc(100vh - 340px)", 
                  overflowY: "auto",
                  paddingRight: 6,
                  paddingBottom: 18, 
                }}
              >
                {perfumes.length === 0 && (
                  <div style={{ opacity: 0.8 }}>{loading ? "Učitavam..." : "Nema parfema."}</div>
                )}

                {perfumes.map((p: SalesPerfumeDTO) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: 14,
                      borderRadius: 14,
                      background: "rgba(0,0,0,0.04)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900 }}>{p.name}</div>
                      <div style={{ opacity: 0.85, marginTop: 4, fontSize: 13 }}>
                        {p.description}
                      </div>
                      <div style={{ opacity: 0.85, marginTop: 8, fontSize: 13 }}>
                        Cena: <b>{Number(p.price).toFixed(2)}</b> | Na stanju: <b>{p.stock}</b> |
                        Status: <b>{p.available ? "dostupan" : "nedostupan"}</b>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button
                        className="btn btn-accent"
                        onClick={() => addToCart(p)}
                        disabled={loading || !p.available || p.stock <= 0}
                        style={{ borderRadius: 12, padding: "10px 16px", fontWeight: 900 }}
                      >
                        Dodaj
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KORPA */}
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(255,255,255,0.95)",
              overflow: "hidden",
              boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
              position: "sticky",
              top: 14,
              maxHeight: "calc(100vh - 60px)", 
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                background: "rgba(50,120,255,0.12)",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                fontWeight: 900,
              }}
            >
              <div>🧺 Korpa ({cart.length})</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                Ukupno: <b>{total.toFixed(2)}</b>
              </div>
            </div>

            
            <div style={{ padding: 12, overflowY: "auto", flex: 1, minHeight: 0, paddingBottom: 22 }}>
              <div
                style={{
                  background: "rgba(0,0,0,0.06)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  padding: 12,
                  borderRadius: 14,
                }}
              >
                {cart.length === 0 && <div style={{ opacity: 0.8 }}>Korpa je prazna.</div>}

                {cart.map((x: CartItem) => (
                  <div
                    key={x.perfume.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 110px 44px",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                      padding: 10,
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {x.perfume.name}
                      </div>
                      <div style={{ opacity: 0.75, fontSize: 12 }}>
                        Cena: {Number(x.perfume.price).toFixed(2)}
                      </div>
                    </div>

                    <input
                      type="number"
                      min={1}
                      max={x.perfume.stock}
                      value={x.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateQty(x.perfume.id, Number(e.target.value))
                      }
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        padding: "8px 10px",
                        textAlign: "center",
                      }}
                      disabled={loading}
                    />

                    <button
                      className="btn"
                      onClick={() => removeFromCart(x.perfume.id)}
                      disabled={loading}
                      style={{ borderRadius: 12, fontWeight: 900, padding: "10px 0" }}
                      title="Ukloni"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <div style={{ fontWeight: 900 }}>Ukupno:</div>
                  <div style={{ fontWeight: 900 }}>{total.toFixed(2)}</div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-accent"
                    onClick={purchase}
                    disabled={loading || cart.length === 0}
                    style={{ width: "100%", borderRadius: 12, padding: "12px 14px", fontWeight: 900 }}
                  >
                    {loading ? "Obrađujem..." : "Kupi"}
                  </button>
                </div>
              </div>

              {/* FISKALNI RAČUN */}
              {receipt && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>Fiskalni račun</div>

                  <div
                    style={{
                      background: "rgba(0,0,0,0.08)",
                      border: "1px solid rgba(0,0,0,0.10)",
                      padding: 12,
                      borderRadius: 14,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ opacity: 0.9 }}>
                        <div>
                          <b>Tip prodaje:</b> {saleType}
                        </div>
                        <div>
                          <b>Način plaćanja:</b> {paymentType}
                        </div>
                      </div>

                      <div style={{ textAlign: "right", opacity: 0.9 }}>
                        <div>
                          <b>Broj računa:</b> {receipt?.racunId ?? receipt?.id ?? "-"}
                        </div>
                        <div>
                          <b>Ukupan iznos:</b>{" "}
                          {Number(receipt?.ukupanIznos ?? receipt?.ukupno ?? total).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 800, marginBottom: 6 }}>Stavke</div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 70px 100px 110px",
                          gap: 8,
                          fontSize: 13,
                          opacity: 0.95,
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>Naziv</div>
                        <div style={{ fontWeight: 800, textAlign: "right" }}>Kol.</div>
                        <div style={{ fontWeight: 800, textAlign: "right" }}>Cena</div>
                        <div style={{ fontWeight: 800, textAlign: "right" }}>Ukupno</div>

                        {lastItems.length === 0 ? (
                          <div style={{ gridColumn: "1 / -1", opacity: 0.75 }}>Nema stavki za prikaz.</div>
                        ) : (
                          lastItems.map((s, idx) => {
                            const line = Number(s.kol) * Number(s.cena);
                            return (
                              <React.Fragment key={`${s.naziv}-${idx}`}>
                                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{s.naziv}</div>
                                <div style={{ textAlign: "right" }}>{s.kol}</div>
                                <div style={{ textAlign: "right" }}>{Number(s.cena).toFixed(2)}</div>
                                <div style={{ textAlign: "right" }}>{Number(line).toFixed(2)}</div>
                              </React.Fragment>
                            );
                          })
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                        <div style={{ fontWeight: 800 }}>Ukupno za naplatu:</div>
                        <div style={{ fontWeight: 800 }}>
                          {Number(receipt?.ukupanIznos ?? totalToShow ?? total).toFixed(2)}
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <button
                          className="btn"
                          onClick={() => setReceipt(null)}
                          style={{ borderRadius: 12, width: "100%", fontWeight: 900 }}
                        >
                          Zatvori račun
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR KOD */}
              {qrCode && (
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>QR kod računa</div>
                  <div
                    style={{
                      background: "rgba(0,0,0,0.08)",
                      padding: 14,
                      borderRadius: 14,
                      display: "inline-block",
                      border: "1px solid rgba(0,0,0,0.10)",
                    }}
                  >
                    <img
                      src={qrCode}
                      alt="QR kod"
                      style={{ width: 220, maxWidth: "100%", height: "auto" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  </div>
);



}