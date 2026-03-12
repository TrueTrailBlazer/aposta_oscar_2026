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

  // Agrupando apostas por categoria
  const apostasPorCategoria = apostas.reduce((acc, aposta) => {
    if (!acc[aposta.categoria]) {
      acc[aposta.categoria] = {
        valor: Number(aposta.valor),
        palpites: [],
        vencedor_real: aposta.vencedor_real,
      };
    }
    acc[aposta.categoria].palpites.push(aposta);
    if (aposta.vencedor_real) {
      acc[aposta.categoria].vencedor_real = aposta.vencedor_real;
    }
    return acc;
  }, {});

  // Extrai uma lista única de todos os nomes que apostaram
  const apostadores = [...new Set(apostas.map((a) => a.apostador))];

  // Função do Mesário para gravar o vencedor
  const definirVencedor = async (categoria, indicadoVencedor) => {
    if (!indicadoVencedor) return;
    setLoadingWinner(true);

    const { error } = await supabase
      .from("apostas_oscar")
      .update({ vencedor_real: indicadoVencedor })
      .eq("categoria", categoria);

    setLoadingWinner(false);

    if (error) {
      alert("Erro ao salvar o vencedor.");
    } else {
      carregarApostas();
    }
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
    <div className="bg-background-dark text-slate-100 min-h-screen pb-24 font-display">
      {/* HEADER DINÂMICO - Aceita N pessoas */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-background-dark/90 px-4 py-4">
        <div className="max-w-md mx-auto flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
            TOTAL APOSTADO
          </span>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {apostadores.length === 0 ? (
              <span className="text-sm text-slate-500">
                Faça a primeira aposta...
              </span>
            ) : (
              apostadores.map((nome, index) => {
                // Calcula quanto essa pessoa apostou no total
                const totalApostado = apostas
                  .filter((a) => a.apostador === nome)
                  .reduce((sum, a) => sum + Number(a.valor), 0);

                return (
                  <div key={nome} className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 truncate max-w-[80px]">
                        {nome}
                      </span>
                      <span className="text-primary font-bold text-lg">
                        R$ {totalApostado.toFixed(2)}
                      </span>
                    </div>
                    {/* Linha separadora entre os nomes */}
                    {index < apostadores.length - 1 && (
                      <div className="h-8 w-[1px] bg-white/10"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </header>

      {/* LISTA DE CARDS */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {Object.entries(apostasPorCategoria).map(([categoria, dados]) => {
          const isFinalizado = !!dados.vencedor_real;

          return (
            <article
              key={categoria}
              className={`bg-card-dark border rounded-2xl p-4 shadow-xl transition-colors ${isFinalizado ? "border-primary/30" : "border-white/5"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-extrabold text-white">
                  {categoria}
                </h2>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${isFinalizado ? "bg-primary/20 text-primary border-primary/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}
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

              {/* Lista de Palpites Feitos */}
              <div className="space-y-3 mb-4">
                {dados.palpites.map((palpite) => {
                  let bgClass = "bg-white/5 border-white/10";
                  let textClass = "text-slate-400";
                  let icon = "";

                  if (isFinalizado) {
                    if (palpite.indicado === dados.vencedor_real) {
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
                      className={`flex justify-between items-center p-2 rounded-xl border ${bgClass} transition-all`}
                    >
                      <span
                        className={`text-xs uppercase tracking-tighter ${textClass}`}
                      >
                        {palpite.apostador} {icon}
                      </span>
                      <span
                        className={`text-sm font-bold ${isFinalizado && palpite.indicado === dados.vencedor_real ? "text-green-400" : "text-white"}`}
                      >
                        {palpite.indicado}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ÁREA DO MESÁRIO */}
              <div className="pt-4 border-t border-white/10">
                {!isFinalizado ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Mesário: Vencedor
                    </span>
                    <div className="flex gap-2">
                      <select
                        id={`winner-${categoria}`}
                        className="flex-1 bg-background-dark border border-white/10 rounded-xl text-sm px-3 py-2 text-slate-200 outline-none focus:border-primary"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Quem ganhou?
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
                        className="bg-primary hover:bg-yellow-400 text-black px-4 py-2 rounded-xl text-sm font-extrabold active:scale-95 transition-transform"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/20">
                    <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
                      Vencedor Oficial
                    </span>
                    <span className="text-sm font-black text-white">
                      {dados.vencedor_real}
                    </span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </main>

      {/* FAB: Nova Aposta */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-black rounded-full shadow-[0_0_20px_rgba(242,204,13,0.4)] flex items-center justify-center active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-3xl font-bold">+</span>
      </button>
    </div>
  );
}
