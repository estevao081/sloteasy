interface SloteData {
  code: string;
  description: string;
  quantity: string;
  validity: string; // dd/MM/yy
  date: string; // dd/MM/yy
}

export function Slote({ data, orientation }: { data: SloteData; orientation: "portrait" | "landscape" }) {
  const isLandscape = orientation === "landscape";
  return (
    <div className={`slote ${isLandscape ? "slote-landscape" : "slote-portrait"}`}>
      <div className="slote-top">
        <div className="slote-row">
          <div className="slote-field">
            <span className="slote-label">FILIAL</span>
            <span className="slote-value">{data.branch || "_________"}</span>
          </div>
          <div className="slote-field">
            <span className="slote-label">DATA</span>
            <span className="slote-value">{data.date}</span>
          </div>
        </div>
        <div className="slote-field">
          <span className="slote-label">CÓDIGO</span>
          <span className="slote-code">{data.code || "------"}</span>
        </div>
        <div className="slote-field">
          <span className="slote-label">DESCRIÇÃO</span>
          <span className="slote-desc">{data.description || "—"}</span>
        </div>
        <div className="slote-row">
          <div className="slote-field slote-qty-wrap">
            <span className="slote-label">QUANTIDADE</span>
            <span className="slote-qty">{data.quantity || "0"}</span>
          </div>
          <div className="slote-field slote-sign">
            <span className="slote-label">ASSINATURA</span>
            <span className="slote-sign-line">&nbsp;</span>
          </div>
        </div>
      </div>
      <div className="slote-bottom">
        <span className="slote-bottom-label">VALIDADE</span>
        <span className="slote-bottom-value">{data.validity || "__/__/__"}</span>
      </div>
    </div>
  );
}

export type { SloteData };
