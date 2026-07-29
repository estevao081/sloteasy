interface PreCountRow {
  code: string;
  quantity: string;
}

interface Props {
  orientation: "portrait" | "landscape";
  rows: PreCountRow[]; // vertical: até 6 linhas nesta folha. horizontal: sempre 1 item (rows[0]).
  preContadoPor: string;
}

const PORTRAIT_ROWS = 6;
const COMB_BOXES = 18;

function Comb() {
  return (
    <div className="precount-comb">
      {Array.from({ length: COMB_BOXES }).map((_, i) => (
        <div className="precount-box" key={i} />
      ))}
    </div>
  );
}

export function PreCountSheet({ orientation, rows, preContadoPor }: Props) {
  if (orientation === "landscape") {
    const row = rows[0] ?? { code: "", quantity: "" };
    return (
      <div className="precount-content precount-landscape">
        <Comb />
        <div className="precount-section-label">Código Interno</div>
        <div className="precount-big-value">{row.code || "\u00A0"}</div>
        <Comb />
        <div className="precount-section-label">Quantidade</div>
        <div className="precount-big-value">{row.quantity || "\u00A0"}</div>
        <Comb />
        <div className="precount-footer">
          <div className="precount-signature">
            <div className="precount-label">Pré Contado Por:</div>
            <div className="precount-value">{preContadoPor || "\u00A0"}</div>
          </div>
          <div className="precount-signature">
            <div className="precount-label">Revisado Por:</div>
          </div>
        </div>
      </div>
    );
  }

  const filled = rows.slice(0, PORTRAIT_ROWS);
  const padded: PreCountRow[] = [
    ...filled,
    ...Array.from({ length: PORTRAIT_ROWS - filled.length }, () => ({ code: "", quantity: "" })),
  ];

  return (
    <div className="precount-content">
      <div className="precount-grid">
        <div className="precount-grid-header">
          <div className="precount-col-codigo">Código do Item</div>
          <div className="precount-col-qtd">Quantidade</div>
        </div>
        {padded.map((r, i) => (
          <div className="precount-grid-row" key={i}>
            <div className="precount-codigo">{r.code || "\u00A0"}</div>
            <div className="precount-qtd">{r.quantity || "\u00A0"}</div>
          </div>
        ))}
      </div>
      <div className="precount-footer">
        <div className="precount-signature">
          <div className="precount-label">Pré Contado Por:</div>
          <div className="precount-value">{preContadoPor || "\u00A0"}</div>
        </div>
        <div className="precount-signature">
          <div className="precount-label">Revisado Por:</div>
        </div>
      </div>
    </div>
  );
}

export type { PreCountRow };
