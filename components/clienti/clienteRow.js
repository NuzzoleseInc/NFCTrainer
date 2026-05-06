export default function ClienteRow({ cliente, onUpload }) {
  const activeAsset = cliente.asset?.find(a => a.asset_attivo);

  return (
    <tr className="border-t">
      <td className="p-3">{cliente.nome_cliente}</td>
      <td className="p-3">{cliente.cognome_cliente}</td>
      <td className="p-3">{cliente.cod_fiscale_cliente}</td>

      <td className="p-3">
        {activeAsset?.code_asset || "N/A"}
      </td>

      <td className="p-3">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) =>
            onUpload(e.target.files[0], cliente.id_cliente)
          }
        />

        {cliente.scheda_path_cliente && (
          <p className="text-xs text-green-600 mt-1">
            PDF caricato
          </p>
        )}
      </td>
    </tr>
  );
}