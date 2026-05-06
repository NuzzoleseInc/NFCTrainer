import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-2xl shadow-lg text-center w-full max-w-md">

        <h1 className="text-3xl font-bold mb-6">
          NFC Trainer
        </h1>

        <p className="mb-8 text-gray-600">
          Gestisci clienti e accessi NFC in modo semplice
        </p>

        <div className="flex flex-col gap-4">
          
          <Link href="/login">
            <button className="w-full bg-black text-white p-3 rounded-lg hover:bg-gray-800 transition">
              Accedi
            </button>
          </Link>

          <Link href="/signup">
            <button className="w-full border p-3 rounded-lg hover:bg-gray-100 transition">
              Registrati
            </button>
          </Link>

        </div>

      </div>
    </div>
  );
}