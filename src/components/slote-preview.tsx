import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

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
  lockResponsibleName?: boolean;
  onChange?: (patch: Partial<SloteData>) => void;
  onCodeCommit?: (code: string) => void;
  notFound?: boolean;
  errors?: {
    responsibleName?: boolean;
    code?: boolean;
    quantity?: boolean;
  };
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
  lockResponsibleName = false,
  onChange,
  onCodeCommit,
  notFound,
  errors,
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
      {/* Cabeçalho: Nome, Data */}
      <div className="s-header-row">
        <div className={`s-name${errors?.responsibleName ? " s-field-error" : ""}`}>
          {editable && !lockResponsibleName ? (
            <input
              className={"s-input" + editClass}
              value={data.responsibleName}
              onChange={(e) => onChange?.({ responsibleName: e.target.value })}
            />
          ) : (
            data.responsibleName || "\u00A0"
          )}
        </div>
        <div className="s-date">{data.date}</div>
      </div>

      {/* Espaço em branco */}
      <div className="s-blank">&nbsp;</div>

      {/* Código */}
      <div className={`s-code-container${errors?.code || notFound ? " s-field-error" : ""}`}>
        {editable && <div className="s-code-label">CÓDIGO</div>}
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
          <div className="s-notfound">
            <AlertTriangle />
            Produto não encontrado
          </div>
        )}
      </div>

      {/* Headers Descrição e Quantidade */}
      <div className="s-headers-row">
        <div className="s-header-desc">DESCRIÇÃO</div>
        <div className="s-header-qty">QTD</div>
      </div>

      {/* Valores Descrição e Quantidade */}
      <div className="s-values-row">
        <div className="s-description">
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
        </div>
        <div className={`s-qty${errors?.quantity ? " s-field-error" : ""}`}>
          {editable ? (
            <input
              className={"s-input s-qty-input" + editClass}
              value={data.quantity}
              placeholder="0"
              inputMode="numeric"
              onChange={(e) => onChange?.({ quantity: e.target.value.replace(/[^0-9]/g, "") })}
            />
          ) : (
            data.quantity || "0"
          )}
        </div>
      </div>

      {/* Footer: Validade */}
      <div className="s-footer-row">
        <div className="s-validade-label">VALIDADE</div>
        <div className="s-validade-value-container">
          {editable ? (
            <div className="s-validade-edit">
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
            </div>
          ) : data.validity ? (
            <div className="s-validade-value">{fmtValidity(data.validity)}</div>
          ) : (
            <div className="s-barcode">
              <div />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { SloteData };
