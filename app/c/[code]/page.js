"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function NFCPage() {
  const { code } = useParams();

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

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

    if (url) {
      await handleWorkout(url);
    }

    setLoading(false);
  };

  // 🔥 STESSO BUCKET, SOLO URL
  const getFileUrl = (path) => {
    if (!path) return null;

    const { data } = supabase.storage
      .from("schede")
      .getPublicUrl(path);

    if (!data?.publicUrl) return null;

    return `${data.publicUrl}?t=${Date.now()}`;
  };

  // 📥 QUI È L’UNICA DIFFERENZA VERA
  const handleWorkout = async (url) => {
    try {
      const res = await fetch(url);
      const text = await res.text(); // 👈 ORA È TXT

      if (!text || text.trim().length === 0) {
        setWorkout(null);
        return;
      }

      const parsed = parseWorkout(text);
      setWorkout(parsed);

    } catch (e) {
      console.error(e);
      setWorkout(null);
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

      {workout && (
        <WorkoutView data={workout} />
      )}
    </div>
  );
}