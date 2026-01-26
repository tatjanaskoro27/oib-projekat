import React, { useContext, useEffect, useMemo, useState } from "react";
import AuthContext from "../contexts/AuthContext";
import { SalesAPI } from "../api/sales/SalesAPI";
import type { SalesPerfumeDTO } from "../models/sales/SalesPerfumeDTO";
import type {  PurchaseRequestDTO, PurchaseResponseDTO } from "../models/sales/PurchaseDTO";

type CartItem = {
  perfume: SalesPerfumeDTO;
  quantity: number;
};

export const SalesPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const userId = token ? getUserIdFromJwt(token) : null;


  const api = useMemo(() => new SalesAPI(), []);

  const [perfumes, setPerfumes] = useState<SalesPerfumeDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<PurchaseRequestDTO["saleType"]>("MALOPRODAJA");
  const [paymentType, setPaymentType] = useState<PurchaseRequestDTO["paymentType"]>("GOTOVINA");


  const [result, setResult] = useState<PurchaseResponseDTO | null>(null);


  function getUserIdFromJwt(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    // probaj više mogućih imena, zavisi kako auth MS pravi token
    const id = json.id ?? json.userId ?? json.sub;
    const num = Number(id);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}



  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setError(null);
      setResult(null);
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

    load();
  }, [token, api]);

  const addToCart = (p: SalesPerfumeDTO) => {
    setResult(null);
    setError(null);
    if (!p.available || p.stock <= 0) {
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

  const total = cart.reduce((sum, x) => sum + Number(x.perfume.price) * x.quantity, 0);

  const purchase = async () => {
    if (!token) return;
    setError(null);
    setResult(null);

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
  userId,          // userId mora biti number
  items,
  saleType,
  paymentType,
};

try {
  setLoading(true);
  console.log("DTO SENT:", dto);

  const res = await api.purchase(token!, dto);
  console.log("PURCHASE OK:", res);

  setResult(res);
} catch (err: any) {
  console.log("PURCHASE ERROR FULL:", err);
  console.log("PURCHASE ERROR STATUS:", err?.response?.status);
  console.log("PURCHASE ERROR DATA:", err?.response?.data);

  setError(
    JSON.stringify(
      err?.response?.data ?? { message: err?.message ?? "Error" },
      null,
      2
    )
  );
} finally {
  setLoading(false);
}


  };

  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div className="window" style={{ width: "1100px", maxWidth: "95%", margin: "30px auto" }}>
        <div className="window-content" style={{ padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Sales microservice</h2>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Katalog parfema (GET) + kupovina (POST) preko Gateway-a.
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
              Tip prodaje
              <select value={saleType} onChange={(e) => setSaleType(e.target.value as PurchaseRequestDTO["saleType"])} disabled={loading}>

                <option value="MALOPRODAJA">MALOPRODAJA</option>
                <option value="VELEPRODAJA">VELEPRODAJA</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
              Način plaćanja
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PurchaseRequestDTO["paymentType"])} disabled={loading}>
                 <option value="GOTOVINA">GOTOVINA</option>
                <option value="UPLATA">UPLATA</option>
                <option value="KARTICA">KARTICA</option>
              </select>
            </label>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                className="btn"
                onClick={() => token && api.getPerfumes(token).then(setPerfumes).catch(() => {})}
                disabled={loading || !token}
              >
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
                      <div style={{ opacity: 0.6, marginTop: 6, fontSize: 12 }}>ID: {p.id}</div>
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
                  <div key={x.perfume.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
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

              {result && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 10 }}>Rezultat kupovine</h4>
                  <pre
                    style={{
                      background: "rgba(0,0,0,0.15)",
                      padding: 12,
                      borderRadius: 10,
                      overflowX: "auto",
                      maxHeight: 240,
                    }}
                  >
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
