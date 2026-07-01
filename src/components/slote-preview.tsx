interface SloteData {
  code: string;
  description: string;
  quantity: string;
  validity: string; // dd/MM/yyyy or empty
  date: string; // dd/MM/yyyy
  responsibleName: string;
}

export function Slote({
  data,
  orientation,
}: {
  data: SloteData;
  orientation: "portrait" | "landscape";
}) {
  const sizeClass = orientation === "landscape" ? "slote-full" : "slote-half";
  return (
    <div className={`slote ${sizeClass}`}>
      <table className="slote-table">
        <tbody>
          <tr>
            <td className="s-name">{data.responsibleName || "\u00A0"}</td>
            <td className="s-date-label">DATA</td>
            <td className="s-date">{data.date}</td>
          </tr>
          <tr>
            <td className="s-signature">
              <span className="s-sigline" />
              <span className="s-sigcaption">
                Assinatura do responsável pela criação do Slote
              </span>
            </td>
            <td colSpan={2} className="s-signature">
              <span className="s-sigline" />
              <span className="s-sigcaption">
                Nome e assinatura do responsável por guardar o palete
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="s-blank">&nbsp;</td>
          </tr>
          <tr>
            <td colSpan={3} className="s-code">{data.code || "------"}</td>
          </tr>
          <tr>
            <td className="s-header">DESCRIÇÃO</td>
            <td colSpan={2} className="s-header">QTD</td>
          </tr>
          <tr>
            <td className="s-description">{data.description || "\u00A0"}</td>
            <td colSpan={2} className="s-qty">{data.quantity || "0"}</td>
          </tr>
          <tr className="s-footer-row">
            <td className="s-validade-label">VALIDADE</td>
            {data.validity ? (
              <td colSpan={2} className="s-validade-value">{data.validity}</td>
            ) : (
              <td colSpan={2} className="s-barcode"><div /></td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export type { SloteData };
