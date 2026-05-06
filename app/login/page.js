"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        <h1 className="text-2xl font-bold mb-2 text-center">
          Accesso Palestra
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Accedi al tuo pannello NFC Trainer
        </p>

        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <input
          className="w-full mb-4 p-3 border rounded-lg"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-6 p-3 border rounded-lg"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded-lg hover:bg-gray-800 transition"
        >
          {loading ? "Accesso..." : "Accedi"}
        </button>

        <p className="text-center text-sm mt-6 text-gray-600">
          Non hai un account?{" "}
          <Link href="/signup" className="underline">
            Registrati
          </Link>
        </p>

      </div>
    </div>
  );
}