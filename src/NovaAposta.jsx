import { useState } from "react";
import { supabase } from "./supabaseClient";
import { categoriasOscar } from "./dadosOscar";

export default function NovaAposta({ onClose, onApostaSalva }) {
  const [categoria, setCategoria] = useState("");
  const [indicado, setIndicado] = useState("");
  const [apostador, setApostador] = useState("");
  const [tipoAposta, setTipoAposta] = useState("ganha"); // Novo estado
  const [loading, setLoading] = useState(false);

  const dadosDaCategoria = categoria ? categoriasOscar[categoria] : null;
  const indicados = dadosDaCategoria?.indicados || [];
  const valorAposta = dadosDaCategoria?.valor || 0;

  const handleSalvar = async () => {
    if (!categoria || !indicado || !apostador.trim()) {
      alert("Preencha todos os campos e digite um nome!");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("apostas_oscar").insert([
      {
        categoria,
        indicado,
        apostador: apostador.trim(),
        valor: valorAposta,
        tipo: tipoAposta, // Salvando se é aposta pra ganhar ou perder
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Erro ao salvar aposta.");
      console.error(error);
    } else {
      onApostaSalva();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-background-dark text-slate-100 min-h-[100dvh] flex flex-col z-50 font-display">
      <header className="flex items-center justify-between px-4 py-6 sticky top-0 bg-background-dark z-10 border-b border-white/5">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-primary">
            arrow_back
          </span>
        </button>
        <h1 className="text-lg font-bold tracking-tight">Registrar Palpite</h1>
        <div className="w-10"></div>
      </header>

      {/* pb-24 garante que o conteúdo não fique escondido atrás do footer */}
      <main className="flex-1 overflow-y-auto px-5 py-6 max-w-md mx-auto w-full space-y-6 pb-24">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">
            Quem está apostando?
          </label>
          <input
            type="text"
            value={apostador}
            onChange={(e) => setApostador(e.target.value)}
            placeholder="Digite o nome..."
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-slate-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">
            Categoria
          </label>
          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              setIndicado("");
            }}
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-slate-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f2cc0d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1.25rem",
            }}
          >
            <option value="" disabled>
              Selecionar categoria
            </option>
            {Object.keys(categoriasOscar).map((cat) => (
              <option key={cat} value={cat}>
                {cat} — R$ {categoriasOscar[cat].valor.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">
            Indicado
          </label>
          <select
            value={indicado}
            onChange={(e) => setIndicado(e.target.value)}
            disabled={!categoria}
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-slate-100 outline-none disabled:opacity-30 focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
            style={{
              backgroundImage: categoria
                ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f2cc0d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`
                : "none",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1.25rem",
            }}
          >
            <option value="" disabled>
              Selecionar indicado
            </option>
            {indicados.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Novo Bloco: Tipo de Aposta (Ganha/Perde) */}
        {indicado && (
          <div className="space-y-4 pt-2">
            <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">
              Sua Aposta:
            </label>
            <div className="flex p-1.5 bg-card-dark rounded-2xl border border-white/5">
              <button
                onClick={() => setTipoAposta("ganha")}
                className={`flex-1 flex items-center justify-center h-12 rounded-xl font-bold transition-all ${
                  tipoAposta === "ganha"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Vai Ganhar
              </button>
              <button
                onClick={() => setTipoAposta("perde")}
                className={`flex-1 flex items-center justify-center h-12 rounded-xl font-bold transition-all ${
                  tipoAposta === "perde"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Vai Perder
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-5 bg-background-dark/95 backdrop-blur-md border-t border-white/5 pb-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSalvar}
            disabled={loading}
            className="w-full bg-primary hover:bg-yellow-400 text-black font-extrabold text-lg py-4 rounded-2xl disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-primary/20 uppercase tracking-wide"
          >
            {loading ? "Salvando..." : "Confirmar Aposta"}
          </button>
        </div>
      </footer>
    </div>
  );
}
