import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import NovaAposta from "./NovaAposta";
import { categoriasOscar } from "./dadosOscar";

export default function App() {
  const [apostas, setApostas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loadingWinner, setLoadingWinner] = useState(false);

  const carregarApostas = async () => {
    const { data, error } = await supabase
      .from("apostas_oscar")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setApostas(data);
  };

  useEffect(() => {
    carregarApostas();
  }, []);

  // Agrupa apostas por categoria
  const apostasPorCategoria = apostas.reduce((acc, aposta) => {
    if (!acc[aposta.categoria]) {
      acc[aposta.categoria] = {
        valor: Number(aposta.valor),
        palpites: [],
        vencedor_real: aposta.vencedor_real,
      };
    }
    acc[aposta.categoria].palpites.push(aposta);
    if (aposta.vencedor_real)
      acc[aposta.categoria].vencedor_real = aposta.vencedor_real;
    return acc;
  }, {});

  // Placar inteligente: soma os ganhos ignorando espaços e maiúsculas
  const placar = apostas.reduce((acc, aposta) => {
    const nomeNormalizado = aposta.apostador.trim().toUpperCase();

    if (!acc[nomeNormalizado]) {
      acc[nomeNormalizado] = {
        nomeExibicao: aposta.apostador.trim(),
        ganhos: 0,
      };
    }

    if (aposta.vencedor_real) {
      const apostouPerde = aposta.tipo === "perde";
      const acertouGanha =
        !apostouPerde && aposta.indicado === aposta.vencedor_real;
      const acertouPerde =
        apostouPerde && aposta.indicado !== aposta.vencedor_real;

      if (acertouGanha || acertouPerde) {
        acc[nomeNormalizado].ganhos += Number(aposta.valor);
      }
    }

    return acc;
  }, {});

  const apostadores = Object.values(placar);

  // MESÁRIO: Cravar Vencedor
  const definirVencedor = async (categoria, indicadoVencedor) => {
    if (!indicadoVencedor) return;
    setLoadingWinner(true);

    const { error } = await supabase
      .from("apostas_oscar")
      .update({ vencedor_real: indicadoVencedor })
      .eq("categoria", categoria);

    setLoadingWinner(false);
    if (!error) carregarApostas();
  };

  // MESÁRIO: Editar/Desfazer Vencedor
  const desfazerVencedor = async (categoria) => {
    if (!window.confirm(`Desfazer o resultado de ${categoria}?`)) return;
    setLoadingWinner(true);

    const { error } = await supabase
      .from("apostas_oscar")
      .update({ vencedor_real: null })
      .eq("categoria", categoria);

    setLoadingWinner(false);
    if (!error) carregarApostas();
  };

  // APAGAR APOSTA a qualquer momento
  const deletarAposta = async (id) => {
    if (!window.confirm("Apagar esta aposta definitivamente?")) return;
    const { error } = await supabase
      .from("apostas_oscar")
      .delete()
      .eq("id", id);
    if (!error) carregarApostas();
  };

  if (showForm) {
    return (
      <NovaAposta
        onClose={() => setShowForm(false)}
        onApostaSalva={carregarApostas}
      />
    );
  }

  return (
    <div className="bg-background-dark text-slate-100 min-h-[100dvh] pb-28 font-display">
      {/* HEADER: PLACAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-background-dark/90 px-4 py-4">
        <div className="max-w-md mx-auto flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Placar Ao Vivo (Ganhos)
          </span>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {apostadores.length === 0 ? (
              <span className="text-sm text-slate-500">
                Aguardando apostas...
              </span>
            ) : (
              apostadores.map((pessoa, index) => (
                <div
                  key={pessoa.nomeExibicao}
                  className="flex items-center gap-4 shrink-0"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 truncate max-w-[80px]">
                      {pessoa.nomeExibicao}
                    </span>
                    <span className="text-primary font-bold text-lg">
                      R$ {pessoa.ganhos.toFixed(2)}
                    </span>
                  </div>
                  {index < apostadores.length - 1 && (
                    <div className="h-8 w-[1px] bg-white/10"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </header>

      {/* CARDS */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {Object.entries(apostasPorCategoria).map(([categoria, dados]) => {
          const isFinalizado = !!dados.vencedor_real;

          return (
            <article
              key={categoria}
              className={`bg-card-dark border rounded-2xl p-4 shadow-xl transition-colors ${isFinalizado ? "border-primary/30" : "border-white/5"}`}
            >
              {/* Topo do Card */}
              <div className="flex justify-between items-start mb-4 gap-2">
                <h2 className="text-lg font-extrabold text-white leading-tight">
                  {categoria}
                </h2>
                <span
                  className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${isFinalizado ? "bg-primary/20 text-primary border-primary/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}
                >
                  {isFinalizado ? "Finalizado" : "Pendente"}
                </span>
              </div>

              <div className="mb-4 py-2 px-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                <span className="text-xs text-slate-400">Valor em Jogo</span>
                <span className="text-lg font-bold text-white">
                  R$ {dados.valor.toFixed(2)}
                </span>
              </div>

              {/* LISTA DE PALPITES */}
              <div className="space-y-3 mb-4">
                {dados.palpites.map((palpite) => {
                  let bgClass = "bg-white/5 border-white/10";
                  let textClass = "text-slate-400";
                  let icon = "";

                  const apostouPerde = palpite.tipo === "perde";

                  // Estilização baseada no acerto/erro
                  if (isFinalizado) {
                    const acertouGanha =
                      !apostouPerde && palpite.indicado === dados.vencedor_real;
                    const acertouPerde =
                      apostouPerde && palpite.indicado !== dados.vencedor_real;

                    if (acertouGanha || acertouPerde) {
                      bgClass = "bg-green-500/10 border-green-500/30";
                      textClass = "text-green-400 font-bold";
                      icon = "✓";
                    } else {
                      bgClass = "bg-red-500/10 border-red-500/20 opacity-60";
                      textClass = "text-red-400";
                      icon = "✗";
                    }
                  }

                  return (
                    <div
                      key={palpite.id}
                      className={`flex justify-between items-center p-3 rounded-xl border ${bgClass} transition-all gap-2`}
                    >
                      {/* Esquerda: Nome e Status */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className={`text-xs uppercase tracking-tighter truncate ${textClass}`}
                        >
                          {palpite.apostador} {icon}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${apostouPerde ? "text-orange-400" : "text-blue-400"}`}
                        >
                          Apostou que {apostouPerde ? "Perde" : "Ganha"}
                        </span>
                      </div>

                      {/* Direita: Filme e Lixeira */}
                      <div className="flex items-center gap-2 shrink-0 max-w-[55%]">
                        <span
                          className={`text-sm font-bold text-right leading-tight ${isFinalizado && (textClass.includes("green") || textClass.includes("red")) ? textClass : "text-white"}`}
                        >
                          {palpite.indicado}
                        </span>
                        <button
                          onClick={() => deletarAposta(palpite.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors p-1"
                          title="Apagar Palpite"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ÁREA DO MESÁRIO */}
              <div className="pt-4 border-t border-white/10">
                {!isFinalizado ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Mesário: Vencedor Oficial
                    </span>
                    <div className="flex gap-2">
                      <select
                        id={`winner-${categoria}`}
                        className="flex-1 min-w-0 bg-background-dark border border-white/10 rounded-xl text-sm px-3 py-2 text-slate-200 outline-none focus:border-primary"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Quem levou?
                        </option>
                        {categoriasOscar[categoria]?.indicados.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={loadingWinner}
                        onClick={() =>
                          definirVencedor(
                            categoria,
                            document.getElementById(`winner-${categoria}`)
                              .value,
                          )
                        }
                        className="bg-primary hover:bg-yellow-400 text-black px-4 py-2 rounded-xl text-sm font-extrabold active:scale-95 transition-transform shrink-0"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/20 gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
                        Vencedor Oficial
                      </span>
                      <span className="text-sm font-black text-white truncate">
                        {dados.vencedor_real}
                      </span>
                    </div>
                    <button
                      onClick={() => desfazerVencedor(categoria)}
                      disabled={loadingWinner}
                      className="text-primary hover:text-white p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                      title="Editar Resultado"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </main>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-primary text-black rounded-full shadow-[0_0_20px_rgba(242,204,13,0.4)] flex items-center justify-center active:scale-95 transition-transform z-50"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}
