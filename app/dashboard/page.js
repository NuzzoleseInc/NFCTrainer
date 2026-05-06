"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [cf, setCf] = useState("");

  const [palestraId, setPalestraId] = useState(null);

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: userData, error } = await supabase.auth.getUser();

    if (error || !userData?.user) {
      console.error("Auth error");
      return;
    }

    const user = userData.user;

    const { data: palestra } = await supabase
      .from("palestra")
      .select("id_palestra")
      .eq("user_id", user.id)
      .single();

    if (!palestra) return;

    setPalestraId(palestra.id_palestra);

    await fetchClienti(palestra.id_palestra);
  };

  // =========================
  // FETCH CLIENTI
  // =========================
  const fetchClienti = async (idPalestra) => {
    setLoading(true);

    const { data } = await supabase
      .from("cliente")
      .select(`
        *,
        asset (
          code_asset,
          asset_attivo
        )
      `)
      .eq("id_palestra", idPalestra);

    setClienti(data || []);
    setLoading(false);
  };

  // =========================
  // CREATE CLIENTE
  // =========================
  const createCliente = async () => {
    if (!palestraId) return;

    const { data: cliente, error } = await supabase
      .from("cliente")
      .insert({
        id_palestra: palestraId,
        nome_cliente: nome,
        cognome_cliente: cognome,
        cod_fiscale_cliente: cf,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const codeAsset = `NFC-${crypto.randomUUID().slice(0, 8)}`;

    await supabase.from("asset").insert({
      id_cliente: cliente.id_cliente,
      code_asset: codeAsset,
      asset_attivo: true,
    });

    setNome("");
    setCognome("");
    setCf("");
    setShowForm(false);

    // update locale invece di refetch totale
    await fetchClienti(palestraId);
  };

  // =========================
  // GET ASSET ATTIVO
  // =========================
  const getActiveAsset = (assets) =>
    assets?.find((a) => a.asset_attivo);

  // =========================
  // UPLOAD / OVERWRITE PDF
  // =========================
  const uploadScheda = async (file, cliente) => {
    if (!file || !palestraId) return;

    const fileExt = file.name.split(".").pop();

    // 📌 path stabile per overwrite
    const filePath = `${palestraId}/${cliente.id_cliente}.pdf`;

    // =========================
    // 1. UPLOAD (overwrite ON)
    // =========================
    const { error: uploadError } = await supabase.storage
      .from("schede")
      .upload(filePath, file, {
        upsert: true, // 🔥 fondamentale
        contentType: "application/pdf",
      });

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    // =========================
    // 2. UPDATE DB
    // =========================
    const { error: dbError } = await supabase
      .from("cliente")
      .update({
        scheda_path_cliente: filePath,
      })
      .eq("id_cliente", cliente.id_cliente);

    if (dbError) {
      alert(dbError.message);
      return;
    }

    // =========================
    // 3. UPDATE STATE LOCALE (NO refetch necessario)
    // =========================
    setClienti((prev) =>
      prev.map((c) =>
        c.id_cliente === cliente.id_cliente
          ? { ...c, scheda_path_cliente: filePath }
          : c
      )
    );
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Dashboard Clienti
      </h1>

      <button
        onClick={() => setShowForm((v) => !v)}
        className="mb-4 bg-black text-white px-4 py-2 rounded"
      >
        + Nuovo cliente
      </button>

      {/* FORM */}
      {showForm && (
        <div className="bg-gray-100 p-4 rounded mb-6">
          <input
            className="w-full p-2 mb-2 border"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            className="w-full p-2 mb-2 border"
            placeholder="Cognome"
            value={cognome}
            onChange={(e) => setCognome(e.target.value)}
          />

          <input
            className="w-full p-2 mb-2 border"
            placeholder="Codice fiscale"
            value={cf}
            onChange={(e) => setCf(e.target.value)}
          />

          <button
            onClick={createCliente}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Salva
          </button>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <p>Caricamento...</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Cognome</th>
              <th className="p-3 text-left">CF</th>
              <th className="p-3 text-left">NFC</th>
              <th className="p-3 text-left">Scheda PDF</th>
            </tr>
          </thead>

          <tbody>
            {clienti.map((c) => {
              const asset = getActiveAsset(c.asset);

              return (
                <tr key={c.id_cliente} className="border-t">
                  <td className="p-3">{c.nome_cliente}</td>
                  <td className="p-3">{c.cognome_cliente}</td>
                  <td className="p-3">{c.cod_fiscale_cliente}</td>
                  <td className="p-3">
                    {asset?.code_asset || "N/A"}
                  </td>

                  <td className="p-3">
                    <label className="text-blue-600 underline cursor-pointer">
                      {c.scheda_path_cliente
                        ? "Sostituisci PDF"
                        : "Carica PDF"}

                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          uploadScheda(
                            e.target.files?.[0],
                            c
                          )
                        }
                      />
                    </label>

                    {c.scheda_path_cliente && (
                      <p className="text-green-600 text-xs mt-1">
                        PDF presente
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}