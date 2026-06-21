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

    if (error || !data?.cliente) {
      setCliente(null);
      setLoading(false);
      return;
    }

    const c = data.cliente;
    setCliente(c);

    const url = getFileUrl(c.scheda_path_cliente);

    if (url) {
      await loadWorkout(url);
    }

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

  const loadWorkout = async (url) => {
    try {
      const res = await fetch(url);
      const text = await res.text();

      if (!text?.trim()) {
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
        <p>Caricamento scheda...</p>
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

      {workout ? (
        <WorkoutView data={workout} />
      ) : (
        <p className="text-center text-gray-500">
          Nessuna scheda disponibile
        </p>
      )}

    </div>
  );
}