import React, { useState, useEffect } from "react";
import logo from "./assets/logo.png"; // Import the logo image

// ===================== DADOS DO NEGÓCIO =====================
const WHATSAPP_NUMBER = "5571982330587"; // 55 + DDD + número

const SIZES = {
  redondo: [
    { id: "r15", label: "15 cm (12–15 fatias)", cm: 15, slices: "12–15", base: 120 },
    { id: "r22", label: "22 cm (22–25 fatias)", cm: 22, slices: "22–25", base: 165 },
    { id: "r27", label: "27 cm (35–37 fatias)", cm: 27, slices: "35–37", base: 230 },
    { id: "r34", label: "34 cm (50–55 fatias)", cm: 34, slices: "50–55", base: 280 },
  ],
  retangular: [
    { id: "t28", label: "28 cm (35–38 fatias)", cm: 28, slices: "35–38", base: 240 },
    { id: "t32", label: "32 cm (45–48 fatias)", cm: 32, slices: "45–48", base: 270 },
    { id: "t37", label: "37 cm (55–58 fatias)", cm: 37, slices: "55–58", base: 300 },
    { id: "t43", label: "43 cm (69–72 fatias)", cm: 43, slices: "69–72", base: 350 },
  ],
};

const MASSAS = [
  "Baunilha",
  "Chocolate",
  "Coco",
  "Mesclado",
  "Formigueiro",
];

const RECHEIOS = [
  "Coco",
  "Chocolate",
  "Prestígio",
  "Maracujá",
  "Chocolate branco (c/ acréscimo)",
  "Ninho com Oreo",
  "Amendoim",
  "Ameixa",
  "A escolher",
];

// Acréscimos conforme instruções
const ACRESCIMOS = [
  { id: "morango_chocobranco", label: "Morango e/ou Chocolate Branco", value: 10 },
  { id: "castanha_nozes", label: "Castanha e/ou Nozes", value: 15 },
];

// ===================== HELPERS =====================
const brl = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function maxRecheiosPermitidos(shape, sizeId) {
  const lista = SIZES[shape] || [];
  const sel = lista.find((s) => s.id === sizeId);
  if (!sel) return 1;
  // Regra: Menos de 27 cm → 1 recheio. A partir de 27 cm → até 3 recheios
  return sel.cm >= 27 ? 3 : 1;
}

// ===================== COMPONENTE =====================
export default function MonyBolosApp() {
  const [shape, setShape] = useState("redondo");
  const [sizeId, setSizeId] = useState(SIZES.redondo[0].id);
  const [massa, setMassa] = useState(MASSAS[0]);
  const [recheios, setRecheios] = useState([]);
  const [acrescimos, setAcrescimos] = useState([]);
  const [observacoes, setObservacoes] = useState("");

  const sizeList = SIZES[shape];
  const selectedSize = sizeList.find((s) => s.id === sizeId) ?? sizeList[0];
  const maxRecheios = maxRecheiosPermitidos(shape, sizeId);

  const total = (() => {
    let total = selectedSize.base;
    // Acréscimos fixos
    for (const a of acrescimos) total += a.value;
    return total;
  })();

  const handleToggleRecheio = (opt) => {
    const idx = recheios.indexOf(opt);
    if (idx >= 0) {
      setRecheios(recheios.filter((r) => r !== opt));
    } else {
      if (recheios.length >= maxRecheios) return; // bloqueia se atingiu o máximo
      setRecheios([...recheios, opt]);
    }
  };

  const handleToggleAcrescimo = (acc) => {
    const exists = acrescimos.find((a) => a.id === acc.id);
    if (exists) setAcrescimos(acrescimos.filter((a) => a.id !== acc.id));
    else setAcrescimos([...acrescimos, acc]);
  };

  const resumo = {
    formato: shape === "redondo" ? "Redondo" : "Retangular",
    tamanho: selectedSize.label,
    massa,
    recheios: recheios.length ? recheios.join(", ") : "—",
    acrescimos:
      acrescimos.length ? acrescimos.map((a) => `${a.label} (+${brl(a.value)})`).join(", ") : "—",
    observacoes: observacoes || "—",
    total,
  };

  const canSend = massa && selectedSize && (recheios.length > 0 || maxRecheios === 1);

  const sendToWhatsApp = () => {
    const msg = [
      "Olá, Mony Bolos! Quero solicitar um pedido:",
      `• Formato: ${resumo.formato}`,
      `• Tamanho: ${resumo.tamanho}`,
      `• Massa: ${resumo.massa}`,
      `• Recheio(s): ${resumo.recheios}`,
      `• Acréscimos: ${resumo.acrescimos}`,
      `• Observações: ${resumo.observacoes}`,
      `• Total: ${brl(resumo.total)}`,
      "\n*Observações importantes:* não inclui topper/glitter e não realizam entrega.",
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Incluindo a tag script para o Tailwind CSS para que os estilos funcionem.
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.tailwindcss.com";
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white text-slate-800">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-pink-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Mony Bolos Logo" className="w-10 h-10 rounded-2xl" />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Mony Bolos</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">Monte seu bolo • Preço em tempo real</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Coluna esquerda: seleções */}
        <section
          className="lg:col-span-2"
        >
          {/* Formato */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6 mb-4">
            <h2 className="text-lg font-bold mb-3">Formato</h2>
            <div className="flex flex-wrap gap-2">
              {([
                { k: "redondo", label: "Redondo" },
                { k: "retangular", label: "Retangular" },
              ]).map((opt) => (
                <button
                  key={opt.k}
                  onClick={() => {
                    setShape(opt.k);
                    const first = SIZES[opt.k][0]?.id;
                    if (first) setSizeId(first);
                    setRecheios([]); // reset recheios por causa da regra de limite
                  }}
                  className={`px-4 py-2 rounded-xl border text-sm transition shadow-sm ${shape === opt.k
                    ? "bg-pink-600 text-white border-pink-600"
                    : "bg-white hover:bg-pink-50 border-slate-200"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tamanho */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6 mb-4">
            <h2 className="text-lg font-bold mb-3">Tamanho</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {sizeList.map((s) => (
                <label key={s.id} className={`cursor-pointer rounded-xl border p-3 sm:p-4 shadow-sm transition ${sizeId === s.id ? "border-pink-600 ring-2 ring-pink-200" : "border-slate-200 hover:border-pink-300"
                  }`}>
                  <input
                    type="radio"
                    name="size"
                    className="hidden"
                    checked={sizeId === s.id}
                    onChange={() => {
                      setSizeId(s.id);
                      setRecheios([]); // reset pelo limite
                    }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{s.label}</div>
                      <div className="text-xs text-slate-500">Base: {brl(s.base)}</div>
                    </div>
                    <div className="text-xs text-slate-400">{shape === "redondo" ? "Ø" : "↔"} {s.cm} cm</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Regra de recheios: {selectedSize.cm < 27 ? "1 recheio" : "até 3 recheios"}.</p>
          </div>

          {/* Massa */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6 mb-4">
            <h2 className="text-lg font-bold mb-3">Massa</h2>
            <div className="flex flex-wrap gap-2">
              {MASSAS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMassa(m)}
                  className={`px-3 py-2 rounded-xl border text-sm shadow-sm transition ${massa === m ? "bg-pink-600 text-white border-pink-600" : "bg-white hover:bg-pink-50 border-slate-200"
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Recheios */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Recheio(s)</h2>
              <span className="text-xs text-slate-500">Selecione até {maxRecheios}.</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {RECHEIOS.map((r) => {
                const active = recheios.includes(r);
                const disabled = !active && recheios.length >= maxRecheios;
                return (
                  <button
                    key={r}
                    onClick={() => handleToggleRecheio(r)}
                    disabled={disabled}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-sm shadow-sm transition ${active
                      ? "bg-pink-600 text-white border-pink-600"
                      : disabled
                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white hover:bg-pink-50 border-slate-200"
                      }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acréscimos */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6 mb-4">
            <h2 className="text-lg font-bold mb-3">Acréscimos</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {ACRESCIMOS.map((a) => {
                const active = !!acrescimos.find((x) => x.id === a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => handleToggleAcrescimo(a)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-sm shadow-sm transition ${active ? "bg-pink-100 border-pink-300" : "bg-white hover:bg-pink-50 border-slate-200"
                      }`}
                  >
                    {a.label} (+{brl(a.value)})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-2">Observações</h2>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: sem lactose, retirar açúcar do chantilly, escrever 'Feliz Aniversário' no lateral..."
              className="w-full min-h-[90px] rounded-xl border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-pink-200"
            />
            <p className="text-xs text-slate-500 mt-2">Não inclui topo de bolo (topper) nem glitter. Não fazemos entrega.</p>
          </div>
        </section>

        {/* Coluna direita: resumo */}
        <aside
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6 sticky top-20">
            <h2 className="text-lg font-bold mb-4">Resumo do Pedido</h2>

            <ul className="space-y-3 text-sm">
              <li className="flex justify-between gap-3"><span className="text-slate-500">Formato</span><span className="font-medium">{resumo.formato}</span></li>
              <li className="flex justify-between gap-3"><span className="text-slate-500">Tamanho</span><span className="font-medium text-right">{resumo.tamanho}</span></li>
              <li className="flex justify-between gap-3"><span className="text-slate-500">Massa</span><span className="font-medium">{resumo.massa}</span></li>
              <li>
                <div className="text-slate-500 mb-1">Recheio(s)</div>
                <div className="font-medium">{resumo.recheios}</div>
              </li>
              <li>
                <div className="text-slate-500 mb-1">Acréscimos</div>
                <div className="font-medium">{resumo.acrescimos}</div>
              </li>
              <li>
                <div className="text-slate-500 mb-1">Observações</div>
                <div className="font-medium break-words">{resumo.observacoes}</div>
              </li>
            </ul>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500">Total</span>
                <span className="text-2xl font-extrabold">{brl(total)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Valor estimado. Confirmação final pelo WhatsApp.</p>
            </div>

            <button
              onClick={sendToWhatsApp}
              disabled={!canSend}
              className={`w-full mt-4 px-4 py-3 rounded-xl shadow-sm font-semibold transition ${canSend
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
            >
              Finalizar no WhatsApp
            </button>
          </div>
        </aside>
      </main>

      <footer className="max-w-5xl mx-auto p-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Mony Bolos — preços base e regras conforme catálogo. Sem topper/glitter. Não realizamos entrega.
      </footer>
    </div>
  );
}