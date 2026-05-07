"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async () => {

    // VALIDAZIONE
    if (!nome.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Compila tutti i campi");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErrorMsg("Errore durante la registrazione");
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("palestra")
      .insert({
        nome_palestra: nome,
        user_id: user.id,
        palestra_attiva: true,
      });

    if (dbError) {
      setErrorMsg(dbError.message);
      setLoading(false);
      return;
    }

    alert("Registrazione completata!");

    setNome("");
    setEmail("");
    setPassword("");

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        <h1 className="text-2xl font-bold mb-2 text-center">
          Crea il tuo account
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Inizia a gestire la tua palestra
        </p>

        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <input
          className="w-full mb-4 p-3 border rounded-lg"
          placeholder="Nome palestra"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          type="email"
          className="w-full mb-4 p-3 border rounded-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-6 p-3 border rounded-lg"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          disabled={
            loading ||
            !nome.trim() ||
            !email.trim() ||
            !password.trim()
          }
          className={`w-full p-3 rounded-lg transition ${
            loading ||
            !nome.trim() ||
            !email.trim() ||
            !password.trim()
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {loading ? "Creazione..." : "Registrati"}
        </button>

        <p className="text-center text-sm mt-6 text-gray-600">
          Hai già un account?{" "}
          <Link href="/login" className="underline">
            Accedi
          </Link>
        </p>

      </div>
    </div>
  );
}