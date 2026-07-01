import { useEffect, useRef } from "react";

interface SloteData {
  code: string;
  description: string;
  quantity: string;
  validity: string; // yyyy-MM-dd (input value) — display converted outside
  date: string; // dd/MM/yyyy
  responsibleName: string;
}

interface Props {
  data: SloteData;
  orientation: "portrait" | "landscape";
  editable?: boolean;
  onChange?: (patch: Partial<SloteData>) => void;
  onCodeCommit?: (code: string) => void;
  notFound?: boolean;
}

function fmtValidity(v: string) {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  if (!y || !m || !d) return v;
  return `${d}/${m}/${y}`;
}

export function Slote({
  data,
  orientation,
  editable = false,
  onChange,
  onCodeCommit,
  notFound,
}: Props) {
  const sizeClass = orientation === "landscape" ? "slote-full" : "slote-half";
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editable) return;
    const el = codeRef.current;
    if (!el) return;
    const handler = () => onCodeCommit?.(el.value);
    el.addEventListener("blur", handler);
    return () => el.removeEventListener("blur", handler);
  }, [editable, onCodeCommit]);

  const editClass = editable ? " s-edit" : "";

  return (
    <div className={`slote ${sizeClass}${editable ? " slote-editable" : ""}`}>
      <table className="slote-table">
        <tbody>
          <tr>
            <td className="s-name">
              {editable ? (
                <input
                  className={"s-input" + editClass}
                  value={data.responsibleName}
                  placeholder="Seu nome"
                  onChange={(e) => onChange?.({ responsibleName: e.target.value })}
                />
              ) : (
                data.responsibleName || "\u00A0"
              )}
            </td>
            <td className="s-date-label">DATA</td>
            <td className="s-date">{data.date}</td>
          </tr>
          <tr>
            <td className="s-signature">
              <span className="s-sigcaption">
                Assinatura
              </span>
            </td>
            <td colSpan={2} className="s-signature">
              <span className="s-sigcaption">
                Nome do empilhador
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="s-blank">&nbsp;</td>
          </tr>
          <tr>
            <td colSpan={3} className="s-code">
              {editable ? (
                <input
                  ref={codeRef}
                  className={"s-input s-code-input" + editClass}
                  value={data.code}
                  placeholder="CÓDIGO"
                  onChange={(e) => onChange?.({ code: e.target.value })}
                />
              ) : (
                data.code || "------"
              )}
              {editable && notFound && (
                <div className="s-notfound">Produto não encontrado</div>
              )}
            </td>
          </tr>
          <tr>
            <td className="s-header">DESCRIÇÃO</td>
            <td colSpan={2} className="s-header">QTD</td>
          </tr>
          <tr>
            <td className="s-description">
              {editable ? (
                <input
                  className={"s-input s-desc-input" + editClass}
                  value={data.description}
                  placeholder="—"
                  readOnly
                />
              ) : (
                data.description || "\u00A0"
              )}
            </td>
            <td colSpan={2} className="s-qty">
              {editable ? (
                <input
                  className={"s-input s-qty-input" + editClass}
                  value={data.quantity}
                  placeholder="0"
                  inputMode="numeric"
                  onChange={(e) =>
                    onChange?.({ quantity: e.target.value.replace(/[^0-9]/g, "") })
                  }
                />
              ) : (
                data.quantity || "0"
              )}
            </td>
          </tr>
          <tr className="s-footer-row">
            <td className="s-validade-label">VALIDADE</td>
            {editable ? (
              <td colSpan={2} className="s-validade-value s-validade-edit">
                <input
                  type="date"
                  className={"s-input s-val-input" + editClass}
                  value={data.validity}
                  onChange={(e) => onChange?.({ validity: e.target.value })}
                />
                {!data.validity && (
                  <div className="s-barcode-hint">
                    <div />
                  </div>
                )}
              </td>
            ) : data.validity ? (
              <td colSpan={2} className="s-validade-value">
                {fmtValidity(data.validity)}
              </td>
            ) : (
              <td colSpan={2} className="s-barcode">
                <div />
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export type { SloteData };
