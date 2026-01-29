import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import { UserAPI } from "../api/users/UserAPI";
import type { UserDTO } from "../models/users/UserDTO";
import type { CreateUserDTO } from "../models/users/CreateUserDTO";
import type { UpdateUserDTO } from "../models/users/UpdateUserDTO";

type SortKey = "id" | "username" | "email" | "role";
type SortDir = "asc" | "desc";

const emptyCreate: CreateUserDTO = {
  username: "",
  password: "",
  email: "",
  role: "seller",
  profileImage: "",
};

const UsersPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const navigate = useNavigate();
  const api = useMemo(() => new UserAPI(), []);

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [createOpen, setCreateOpen] = useState(false);
  const [createDto, setCreateDto] = useState<CreateUserDTO>({ ...emptyCreate });

  const [editId, setEditId] = useState<number | null>(null);
  const [editDto, setEditDto] = useState<UpdateUserDTO>({});

  const loadUsers = async () => {
    if (!token) return;
    setError(null);
    setInfo(null);

    try {
      setLoading(true);
      const data = await api.getAllUsers(token);
      setUsers(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Greška pri učitavanju korisnika.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = !term
      ? users
      : users.filter(
          (u) =>
            String(u.id).includes(term) ||
            u.username.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.role.toLowerCase().includes(term),
        );

    return [...base].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];

      if (typeof av === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [users, q, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const startEdit = (u: UserDTO) => {
    setEditId(u.id);
    setEditDto({
      username: u.username,
      email: u.email,
      role: u.role,
      profileImage: u.profileImage ?? "",
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditDto({});
  };

  const submitCreate = async () => {
    if (!token) return;

    try {
      setBusy(true);
      await api.createUser(token, createDto);
      setInfo("Korisnik je kreiran.");
      setCreateDto({ ...emptyCreate });
      setCreateOpen(false);
      loadUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greška pri kreiranju.");
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!token || editId === null) return;

    try {
      setBusy(true);
      await api.updateUser(token, editId, editDto);
      setInfo("Korisnik je izmenjen.");
      cancelEdit();
      loadUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greška pri izmeni.");
    } finally {
      setBusy(false);
    }
  };

  const submitDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Obrisati korisnika?")) return;

    try {
      setBusy(true);
      await api.deleteUser(token, id);
      setInfo("Korisnik je obrisan.");
      loadUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greška pri brisanju.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div className="window" style={{ width: 1100, margin: "30px auto" }}>
        <div className="window-content" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2>Users (admin)</h2>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={() => navigate("/dashboard")}>
                ⬅ Nazad na meni
              </button>
              <button className="btn" onClick={loadUsers}>
                Refresh
              </button>
              <button
                className="btn btn-accent"
                onClick={() => setCreateOpen((v) => !v)}
              >
                Create user
              </button>
            </div>
          </div>

          {error && <div style={{ color: "crimson" }}>{error}</div>}
          {info && <div style={{ color: "var(--win11-accent)" }}>{info}</div>}

          <input
            placeholder="Pretraga..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ marginTop: 12, minWidth: 300 }}
          />

          <table style={{ width: "100%", marginTop: 12 }}>
            <thead>
              <tr>
                {(["id", "username", "email", "role"] as SortKey[]).map((k) => (
                  <th key={k} onClick={() => toggleSort(k)}>
                    {k.toUpperCase()}
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    {editId === u.id ? (
                      <input
                        value={editDto.username ?? ""}
                        onChange={(e) =>
                          setEditDto({ ...editDto, username: e.target.value })
                        }
                      />
                    ) : (
                      u.username
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {editId === u.id ? (
                      <>
                        <button className="btn" onClick={submitEdit}>
                          Save
                        </button>
                        <button className="btn" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={() => startEdit(u)}>
                          Edit
                        </button>
                        <button
                          className="btn"
                          onClick={() => submitDelete(u.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
