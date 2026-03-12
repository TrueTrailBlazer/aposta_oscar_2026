import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import NovaAposta from "./NovaAposta";
import { categoriasOscar } from "./dadosOscar";

export default function App() {
  const [apostas, setApostas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loadingWinner, setLoadingWinner] = useState(false);

  // Estado para controlar o Modal de confirmação customizado
  const [modalConfig, setModalConfig] = useState(null);

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

  // Funções que chamam o Modal Customizado
  const abrirModalDesfazer = (categoria) => {
    setModalConfig({
      title: "Editar Resultado",
      message: `Deseja reabrir a categoria "${categoria}" para alterar o vencedor oficial?`,
      actionLabel: "Editar",
      actionClass: "bg-[#f2cc0d] hover:bg-yellow-500 text-black",
      onConfirm: async () => {
        setModalConfig(null);
        setLoadingWinner(true);
        const { error } = await supabase
          .from("apostas_oscar")
          .update({ vencedor_real: null })
          .eq("categoria", categoria);
        setLoadingWinner(false);
        if (!error) carregarApostas();
      },
    });
  };

  const abrirModalDeletar = (id) => {
    setModalConfig({
      title: "Apagar Palpite",
      message:
        "Tem certeza que deseja apagar esta aposta definitivamente? Essa ação não pode ser desfeita.",
      actionLabel: "Apagar",
      actionClass:
        "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30",
      onConfirm: async () => {
        setModalConfig(null);
        const { error } = await supabase
          .from("apostas_oscar")
          .delete()
          .eq("id", id);
        if (!error) carregarApostas();
      },
    });
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
    <div className="bg-[#121212] text-white min-h-[100dvh] pb-28 font-manrope">
      {/* HEADER: PLACAR AO VIVO */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-[#121212]/90 px-4 py-4">
        <div className="max-w-md mx-auto flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Placar Ao Vivo (Ganhos)
          </span>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {apostadores.length === 0 ? (
              <span className="text-sm text-zinc-500 font-medium">
                Aguardando apostas...
              </span>
            ) : (
              apostadores.map((pessoa, index) => (
                <div
                  key={pessoa.nomeExibicao}
                  className="flex items-center gap-4 shrink-0"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wide truncate max-w-[80px]">
                      {pessoa.nomeExibicao}
                    </span>
                    <span className="text-[#f2cc0d] font-extrabold text-lg">
                      R$ {pessoa.ganhos.toFixed(2)}
                    </span>
                  </div>
                  {index < apostadores.length - 1 && (
                    <div className="h-8 w-[1px] bg-white/5"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </header>

      {/* CARDS */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {Object.entries(apostasPorCategoria).map(([categoria, dados]) => {
          const isFinalizado = !!dados.vencedor_real;

          return (
            <article
              key={categoria}
              className={`bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl border transition-colors ${isFinalizado ? "border-[#f2cc0d]/30" : "border-white/5"}`}
            >
              <header className="p-4 border-b border-white/5">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-extrabold tracking-tight text-white leading-tight">
                    {categoria}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded tracking-widest border ${isFinalizado ? "bg-[#f2cc0d]/20 text-[#f2cc0d] border-[#f2cc0d]/30" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                    >
                      {isFinalizado ? "Finalizado" : "Pendente"}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#f2cc0d] text-[11px] font-semibold uppercase tracking-wider">
                        Valor em Jogo:
                      </span>
                      <span className="text-[#f2cc0d] text-[11px] font-extrabold">
                        R$ {dados.valor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </header>

              <section className="p-4 space-y-3">
                {dados.palpites.map((palpite) => {
                  let containerClass = "bg-white/5 border-white/5";
                  let nameClass = "text-zinc-500";
                  let movieClass = "text-white";
                  let icon = null;

                  const apostouPerde = palpite.tipo === "perde";

                  if (isFinalizado) {
                    const acertouGanha =
                      !apostouPerde && palpite.indicado === dados.vencedor_real;
                    const acertouPerde =
                      apostouPerde && palpite.indicado !== dados.vencedor_real;

                    if (acertouGanha || acertouPerde) {
                      containerClass = "bg-green-500/5 border-green-500/20";
                      nameClass = "text-green-400";
                      movieClass = "text-green-400";
                      icon = (
                        <svg
                          className="text-green-500"
                          fill="none"
                          height="12"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          width="12"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      );
                    } else {
                      containerClass =
                        "bg-red-500/5 border-red-500/20 opacity-70";
                      nameClass = "text-red-400";
                      movieClass = "text-red-400";
                    }
                  }

                  return (
                    <div
                      key={palpite.id}
                      className={`p-4 rounded-xl border flex flex-col gap-1 transition-all relative ${containerClass}`}
                    >
                      {/* Canto superior direito: Tag + Lixeira */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full border tracking-tighter shrink-0 ${apostouPerde ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}
                        >
                          Apostou que {apostouPerde ? "perde" : "ganha"}
                        </span>
                        {!isFinalizado && (
                          <button
                            onClick={() => abrirModalDeletar(palpite.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full"
                            title="Apagar Palpite"
                          >
                            <svg
                              fill="none"
                              height="12"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="12"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Nome e Ícone */}
                      <div className="flex items-center gap-1.5 min-w-0 pr-[110px]">
                        {" "}
                        {/* pr- pág o espaço da tag+lixeira */}
                        <span
                          className={`text-xs font-bold uppercase tracking-wide truncate ${nameClass}`}
                        >
                          {palpite.apostador}
                        </span>
                        {icon}
                      </div>

                      {/* Filme */}
                      <p
                        className={`text-base font-bold pr-[110px] ${movieClass}`}
                      >
                        {palpite.indicado}
                      </p>
                    </div>
                  );
                })}
              </section>

              <footer className="bg-black/20 p-4 border-t border-white/5">
                {!isFinalizado ? (
                  <>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">
                      Mesário: Vencedor
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow min-w-[140px]">
                        <select
                          id={`winner-${categoria}`}
                          className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm font-medium rounded-lg focus:ring-[#f2cc0d] focus:border-[#f2cc0d] block p-2.5 appearance-none outline-none"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Selecione o vencedor
                          </option>
                          {categoriasOscar[categoria]?.indicados.map((ind) => (
                            <option key={ind} value={ind}>
                              {ind}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                          <svg
                            className="fill-current h-4 w-4"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                          </svg>
                        </div>
                      </div>
                      <button
                        disabled={loadingWinner}
                        onClick={() =>
                          definirVencedor(
                            categoria,
                            document.getElementById(`winner-${categoria}`)
                              .value,
                          )
                        }
                        className="whitespace-nowrap bg-[#f2cc0d] hover:bg-yellow-500 text-black font-extrabold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        SALVAR
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="block text-[9px] font-black text-[#f2cc0d] uppercase tracking-[0.2em] mb-1">
                        Vencedor Oficial
                      </span>
                      <span className="text-base font-bold text-white truncate">
                        {dados.vencedor_real}
                      </span>
                    </div>
                    {/* Botão de Editar Resultado: Ícone de Lápis */}
                    <button
                      onClick={() => abrirModalDesfazer(categoria)}
                      disabled={loadingWinner}
                      className="text-[#f2cc0d] hover:text-white p-2.5 rounded-lg bg-[#f2cc0d]/10 hover:bg-[#f2cc0d]/20 transition-colors shrink-0"
                      title="Editar Resultado"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                )}
              </footer>
            </article>
          );
        })}
      </main>

      {/* FAB: NOVA APOSTA */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-[#f2cc0d] hover:bg-yellow-500 text-black rounded-full shadow-[0_0_20px_rgba(242,204,13,0.4)] flex items-center justify-center active:scale-95 transition-all z-50"
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

      {/* MODAL CUSTOMIZADO (POPUP) */}
      {modalConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-extrabold text-white mb-2">
              {modalConfig.title}
            </h3>
            <p className="text-sm text-zinc-400 mb-6">{modalConfig.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalConfig(null)}
                className="flex-1 py-3 rounded-xl font-bold text-zinc-300 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={modalConfig.onConfirm}
                className={`flex-1 py-3 rounded-xl font-extrabold transition-colors ${modalConfig.actionClass}`}
              >
                {modalConfig.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
