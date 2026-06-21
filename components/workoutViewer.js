"use client";

import { useState } from "react";

export default function WorkoutView({ data }) {
  const [checked, setChecked] = useState({});

  if (!data) return null;

  const toggle = (key) => {
    setChecked((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // =========================
  // UNICA
  // =========================
  if (data.tipo === "UNICA") {
    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-md space-y-4 bg-white rounded-xl shadow p-4">

          <h2 className="text-lg font-bold text-center">
            Scheda Allenamento
          </h2>

          <div className="space-y-3">
            {data.esercizi?.map((e, i) => {
              const key = `u-${i}`;

              return (
                <div
                  key={key}
                  className="flex items-center gap-3 border-b pb-3 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={!!checked[key]}
                    onChange={() => toggle(key)}
                  />

                  <div className="flex items-center justify-between w-full gap-2">
                    <p className="font-semibold text-gray-900 truncate">
                      {e.nome}
                    </p>

                    <p className="text-sm text-gray-500 whitespace-nowrap">
                      {e.serie}x{e.ripetizioni}
                      {e.recupero && ` • ${e.recupero}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
  }

  // =========================
  // SETTIMANALE
  // =========================
  if (data.tipo === "SETTIMANALE") {
    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-md space-y-4">

          {data.giorni?.map((g, gi) => (
            <div
              key={gi}
              className="bg-white rounded-xl shadow p-4 space-y-3"
            >
              <h2 className="text-md font-bold text-blue-600 text-center uppercase border-b pb-2">
                {g.nome}
              </h2>

              <div className="space-y-3">
                {g.esercizi?.map((e, ei) => {
                  const key = `s-${gi}-${ei}`;

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 border-b pb-3 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5"
                        checked={!!checked[key]}
                        onChange={() => toggle(key)}
                      />

                      <div className="flex items-center justify-between w-full gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {e.nome}
                        </p>

                        <p className="text-sm text-gray-500 whitespace-nowrap">
                          {e.serie}x{e.ripetizioni}
                          {e.recupero && ` • ${e.recupero}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}

        </div>
      </div>
    );
  }

  return null;
}