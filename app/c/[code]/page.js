"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function NFCPage() {
  const { code } = useParams();

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    fetchCliente();
  }, [code]);

  const fetchCliente = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("asset")
      .select(`
        *,
        cliente (*)
      `)
      .eq("code_asset", code)
      .maybeSingle();

    if (error || !data || !data.cliente) {
      setCliente(null);
      setLoading(false);
      return;
    }

    setCliente(data.cliente);
    setLoading(false);
  };

  // 🔥 FIX CACHE PDF (fondamentale in produzione)
  const getPdfUrl = (path) => {
    if (!path) return null;

    const { data } = supabase.storage
      .from("schede")
      .getPublicUrl(path);

    if (!data?.publicUrl) return null;

    // cache bust per evitare PDF vecchi su Vercel/CDN
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg font-semibold">
          Caricamento scheda...
        </p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6 text-center">
        <p>Cliente non trovato</p>
      </div>
    );
  }

  const pdfUrl = getPdfUrl(cliente.scheda_path_cliente);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-center mb-4">
        {cliente.nome_cliente} {cliente.cognome_cliente}
      </h1>

      {!pdfUrl ? (
        <p className="text-gray-500 text-center">
          Nessuna scheda disponibile
        </p>
      ) : (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-6 bg-black text-white text-center p-4 rounded"
        >
          Apri scheda PDF
        </a>
      )}
    </div>
  );
}