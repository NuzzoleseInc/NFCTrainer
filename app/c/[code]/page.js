"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

import WorkoutView from "@/components/workoutViewer";
import { parseWorkout } from "@/components/workoutParser";

export default function NFCPage() {
  const { code } = useParams();

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const [rawText, setRawText] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

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

    const c = data.cliente;
    setCliente(c);

    const url = getFileUrl(c.scheda_path_cliente);
    setFileUrl(url);

    setLoading(false);
  };

  const getFileUrl = (path) => {
    if (!path) return null;

    const { data } = supabase.storage
      .from("schede")
      .getPublicUrl(path);

    if (!data?.publicUrl) return null;

    return `${data.publicUrl}?t=${Date.now()}`;
  };

  // 📥 LEGGE TXT SOLO QUANDO CLICCHI
  const openScheda = async () => {
    if (!fileUrl) return;

    try {
      const res = await fetch(fileUrl);
      const text = await res.text();

      setRawText(text);

      const parsed = parseWorkout(text);
      setWorkout(parsed);
      setShowRaw(true);

    } catch (e) {
      console.error(e);
    }
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

  return (
    <div className="p-6 max-w-md mx-auto">

      <h1 className="text-xl font-bold text-center mb-4">
        {cliente.nome_cliente} {cliente.cognome_cliente}
      </h1>

      {!fileUrl && (
        <p className="text-gray-500 text-center">
          Nessuna scheda disponibile
        </p>
      )}

      {/* 🔘 BOTTONE PRINCIPALE */}
      {fileUrl && (
        <button
          onClick={openScheda}
          className="block mt-6 bg-black text-white text-center p-4 rounded w-full"
        >
          Apri scheda
        </button>
      )}

      {/* 🧠 WORKOUT UI */}
      {workout && (
        <div className="mt-4">
          <WorkoutView data={workout} />
        </div>
      )}

      {/* 📄 RAW FALLBACK */}
      {showRaw && rawText && !workout && (
        <pre className="mt-4 p-4 bg-gray-100 text-sm whitespace-pre-wrap">
          {rawText}
        </pre>
      )}
    </div>
  );
}