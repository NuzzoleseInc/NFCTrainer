"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [cf, setCf] = useState("");

  const [palestraId, setPalestraId] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // 🔐 INIT AUTH + DATA
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const { data: userData, error } = await supabase.auth.getUser();

    if (error || !userData?.user) {
      setRedirecting(true);
      router.replace("/");
      return;
    }

    const { data: palestra } = await supabase
      .from("palestra")
      .select("id_palestra")
      .eq("user_id", userData.user.id)
      .single();

    if (!palestra) {
      setRedirecting(true);
      router.replace("/");
      return;
    }

    setPalestraId(palestra.id_palestra);
    setAuthChecked(true);

    await fetchClienti(palestra.id_palestra);
  };

  // 🔁 BACK BUTTON = LOGOUT FORZATO
  useEffect(() => {
    const handleBackLogout = async () => {
      await supabase.auth.signOut();
      router.replace("/");
    };

    const onPopState = () => {
      handleBackLogout();
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // 🔁 SAFETY GUARD (focus tab)
  useEffect(() => {
    const onFocus = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace("/");
      }
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // 🚪 LOGOUT BUTTON
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  // 📄 CHECK PDF EXISTS
  const checkPdfExists = async (path) => {
    if (!path) return false;

    const parts = path.split("/");
    const folder = parts[0];
    const file = parts.slice(1).join("/");

    const { data, error } = await supabase.storage
      .from("schede")
      .list(folder, {
        search: file,
        limit: 1,
      });

    if (error) return false;

    return (data || []).length > 0;
  };

  // 📊 FETCH CLIENTI
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

    const enriched = await Promise.all(
      (data || []).map(async (c) => {
        const exists = await checkPdfExists(c.scheda_path_cliente);

        if (!exists && c.scheda_path_cliente) {
          await supabase
            .from("cliente")
            .update({ scheda_path_cliente: null })
            .eq("id_cliente", c.id_cliente);
        }

        return {
          ...c,
          pdf_exists: exists,
        };
      })
    );

    setClienti(enriched);
    setLoading(false);
  };

  // ➕ CREATE CLIENTE
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

    if (error) return alert(error.message);

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

    await fetchClienti(palestraId);
  };

  // 📤 UPLOAD PDF
  const uploadScheda = async (file, cliente) => {
    if (!file || !palestraId) return;

    const filePath = `${palestraId}/${cliente.id_cliente}.pdf`;

    const wasExisting = cliente.pdf_exists;

    const { error } = await supabase.storage
      .from("schede")
      .upload(filePath, file, {
        upsert: true,
        contentType: "application/pdf",
      });

    if (error) return alert(error.message);

    await supabase
      .from("cliente")
      .update({ scheda_path_cliente: filePath })
      .eq("id_cliente", cliente.id_cliente);

    setToast(wasExisting ? "PDF sostituito" : "PDF caricato");

    setTimeout(() => setToast(null), 2000);

    await fetchClienti(palestraId);
  };

  const getActiveAsset = (assets) =>
    assets?.find((a) => a.asset_attivo);

  const pdfLabel = (c) =>
    c.pdf_exists ? "Sostituisci PDF" : "Carica PDF";

  const pdfStatus = (c) =>
    c.pdf_exists ? (
      <p className="text-green-600 text-xs mt-1">PDF presente</p>
    ) : (
      <p className="text-gray-400 text-xs mt-1">PDF non presente</p>
    );

  // 🔐 LOADING / AUTH BLOCK
  if (!authChecked || redirecting) {
    return (
      <div className="p-6 text-center">
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          Dashboard Clienti
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Esci
        </button>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="mb-4 p-2 bg-black text-white rounded">
          {toast}
        </div>
      )}

      {/* NUOVO CLIENTE */}
      <button
        onClick={() => setShowForm(v => !v)}
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
                    {asset?.code_asset ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">
                          {asset.code_asset}
                        </span>

                        <span className="text-blue-600 text-sm break-all">
                          {`${process.env.NEXT_PUBLIC_BASE_URL}/c/${asset.code_asset}`}
                        </span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>

                  <td className="p-3">
                    <label className="text-blue-600 underline cursor-pointer">
                      {pdfLabel(c)}

                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          uploadScheda(e.target.files?.[0], c)
                        }
                      />
                    </label>

                    {pdfStatus(c)}
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