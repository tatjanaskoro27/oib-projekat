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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<PurchaseRequestDTO["saleType"]>("MALOPRODAJA");
  const [paymentType, setPaymentType] = useState<PurchaseRequestDTO["paymentType"]>("GOTOVINA");

  const [receipt, setReceipt] = useState<any | null>(null);

  function getUserIdFromJwt(tok: string): number | null {
    try {
      const payload = tok.split(".")[1];
      const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
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
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Greška pri učitavanju kataloga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerfumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addToCart = (p: SalesPerfumeDTO) => {
    setReceipt(null);
    setError(null);

    if (!p.available || p.stock <= 0) {
      setError("Ovaj parfem trenutno nije dostupan.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((x) => x.perfume.id === p.id);
      if (!existing) return [...prev, { perfume: p, quantity: 1 }];

      return prev.map((x) =>
        x.perfume.id === p.id ? { ...x, quantity: Math.min(x.quantity + 1, p.stock) } : x
      );
    });
  };

  const updateQty = (perfumeId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((x) =>
          x.perfume.id === perfumeId
            ? { ...x, quantity: Math.max(1, Math.min(qty, x.perfume.stock)) }
            : x
        )
        .filter((x) => x.quantity > 0)
    );
  };

  const removeFromCart = (perfumeId: string) => {
    setCart((prev) => prev.filter((x) => x.perfume.id !== perfumeId));
  };

  const total = cart.reduce((sum, x) => sum + Number(x.perfume.price) * x.quantity, 0);

  const purchase = async () => {
    if (!token) return;

    setError(null);
    setReceipt(null);

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

      // prikaz fiskalnog računa
      setReceipt(res?.racun ?? null);

      // očisti korpu
      setCart([]);

      // osveži katalog odmah (stock će se smanjiti)
      const fresh = await api.getPerfumes(token);
      setPerfumes(fresh);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Greška pri kupovini."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div className="window" style={{ width: "1100px", maxWidth: "95%", margin: "30px auto" }}>
        <div className="window-content" style={{ padding: 24 }}>
          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Prodaja</h2>

            <button className="btn" onClick={() => navigate("/dashboard")} disabled={loading}>
              Nazad na meni
            </button>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
              Tip prodaje
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value as PurchaseRequestDTO["saleType"])}
                disabled={loading}
              >
                <option value="MALOPRODAJA">MALOPRODAJA</option>
                <option value="VELEPRODAJA">VELEPRODAJA</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
              Način plaćanja
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PurchaseRequestDTO["paymentType"])}
                disabled={loading}
              >
                <option value="GOTOVINA">GOTOVINA</option>
                <option value="UPLATA">UPLATA</option>
                <option value="KARTICA">KARTICA</option>
              </select>
            </label>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button className="btn" onClick={loadPerfumes} disabled={loading || !token}>
                Osveži katalog
              </button>
            </div>
          </div>

          {error && <div style={{ marginTop: 14, color: "crimson" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginTop: 18 }}>
            {/* KATALOG */}
            <div>
              <h3 style={{ margin: "8px 0 12px" }}>Katalog</h3>

              <div style={{ maxHeight: 420, overflowY: "auto", paddingRight: 6 }}>
                {perfumes.length === 0 && (
                  <div style={{ opacity: 0.8 }}>{loading ? "Učitavam..." : "Nema parfema."}</div>
                )}

                {perfumes.map((p: SalesPerfumeDTO) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: 12,
                      borderRadius: 10,
                      background: "rgba(0,0,0,0.10)",
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ opacity: 0.85, marginTop: 4, fontSize: 13 }}>{p.description}</div>
                      <div style={{ opacity: 0.85, marginTop: 6, fontSize: 13 }}>
                        Cena: <b>{Number(p.price).toFixed(2)}</b> | Na stanju: <b>{p.stock}</b> | Status:{" "}
                        <b>{p.available ? "dostupan" : "nedostupan"}</b>
                      </div>
                      {/* ID se ne prikazuje */}
                    </div>

                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button
                        className="btn btn-accent"
                        onClick={() => addToCart(p)}
                        disabled={loading || !p.available || p.stock <= 0}
                      >
                        Dodaj
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KORPA */}
            <div>
              <h3 style={{ margin: "8px 0 12px" }}>Korpa</h3>

              <div style={{ background: "rgba(0,0,0,0.10)", padding: 12, borderRadius: 10 }}>
                {cart.length === 0 && <div style={{ opacity: 0.8 }}>Korpa je prazna.</div>}

                {cart.map((x: CartItem) => (
                  <div
                    key={x.perfume.id}
                    style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{x.perfume.name}</div>
                      <div style={{ opacity: 0.75, fontSize: 12 }}>Cena: {Number(x.perfume.price).toFixed(2)}</div>
                    </div>

                    <input
                      type="number"
                      min={1}
                      max={x.perfume.stock}
                      value={x.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateQty(x.perfume.id, Number(e.target.value))
                      }
                      style={{ width: 90 }}
                      disabled={loading}
                    />

                    <button className="btn" onClick={() => removeFromCart(x.perfume.id)} disabled={loading}>
                      X
                    </button>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <div style={{ fontWeight: 700 }}>Ukupno:</div>
                  <div style={{ fontWeight: 700 }}>{total.toFixed(2)}</div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-accent"
                    onClick={purchase}
                    disabled={loading || cart.length === 0}
                    style={{ width: "100%" }}
                  >
                    {loading ? "Obrađujem..." : "Kupi"}
                  </button>
                </div>
              </div>

              {/* FISKALNI RAČUN (prikaz umesto JSON) */}
              {receipt && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 10 }}>Fiskalni račun</h4>

                  <div style={{ background: "rgba(0,0,0,0.15)", padding: 12, borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ opacity: 0.9 }}>
                        <div>
                          <b>Tip prodaje:</b> {receipt?.tipProdaje ?? receipt?.saleType ?? "-"}
                        </div>
                        <div>
                          <b>Način plaćanja:</b> {receipt?.nacinPlacanja ?? receipt?.paymentType ?? "-"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right", opacity: 0.9 }}>
                        <div>
                          <b>Broj računa:</b> {receipt?.id ?? receipt?.broj ?? "-"}
                        </div>
                        <div>
                          <b>Datum:</b> {receipt?.datumVreme ?? receipt?.createdAt ?? "-"}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Stavke</div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 90px 120px 120px",
                          gap: 8,
                          fontSize: 13,
                          opacity: 0.95,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>Naziv</div>
                        <div style={{ fontWeight: 700, textAlign: "right" }}>Kol.</div>
                        <div style={{ fontWeight: 700, textAlign: "right" }}>Cena</div>
                        <div style={{ fontWeight: 700, textAlign: "right" }}>Ukupno</div>

                        {(receipt?.stavke ?? receipt?.items ?? []).map((s: any, idx: number) => {
                          const naziv = s?.parfemNaziv ?? s?.name ?? "-";
                          const kol = Number(s?.kolicina ?? s?.quantity ?? 0);
                          const cena = Number(s?.cenaPoKomadu ?? s?.cena ?? s?.price ?? 0);
                          const line = (Number.isFinite(kol) ? kol : 0) * (Number.isFinite(cena) ? cena : 0);

                          return (
                            <React.Fragment key={idx}>
                              <div>{naziv}</div>
                              <div style={{ textAlign: "right" }}>{kol}</div>
                              <div style={{ textAlign: "right" }}>{Number(cena).toFixed(2)}</div>
                              <div style={{ textAlign: "right" }}>{Number(line).toFixed(2)}</div>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                        <div style={{ fontWeight: 700 }}>Ukupno za naplatu:</div>
                        <div style={{ fontWeight: 700 }}>
                          {Number(receipt?.ukupno ?? receipt?.total ?? receipt?.iznos ?? total).toFixed(2)}
                        </div>
                      </div>

                      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                        <button className="btn" onClick={() => setReceipt(null)}>
                          Zatvori račun
                        </button>

                        {/* kasnije: kada napravite endpoint */}
                        {/* <button className="btn btn-accent">Preuzmi PDF</button> */}
                        {/* <button className="btn btn-accent" onClick={() => navigate("/racuni")}>Svi računi</button> */}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
