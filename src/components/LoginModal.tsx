import React, { useState } from "react";
import brasao from "@/assets/brasao.png";
import { Usuario } from "@/types/auth";
import { Lock, User, Shield, Check, LogIn } from "lucide-react";

interface LoginModalProps {
  usuarios: Usuario[];
  usuarioAtual: Usuario | null;
  onLogin: (usuario: Usuario) => void;
  onClose?: () => void;
  obrigatorio?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  usuarios,
  usuarioAtual,
  onLogin,
  onClose,
  obrigatorio = false,
}) => {
  const [loginDigitado, setLoginDigitado] = useState("");
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [erro, setErro] = useState("");

  const autenticarManual = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    const usuario = usuarios.find(
      (u) =>
        u.ativo &&
        u.login.toLowerCase() === loginDigitado.trim().toLowerCase() &&
        u.senha === senhaDigitada.trim()
    );

    if (usuario) {
      onLogin(usuario);
      onClose?.();
    } else {
      setErro("Usuário ou senha incorretos.");
    }
  };

  const selecionarRapido = (u: Usuario) => {
    setLoginDigitado(u.login);
    setSenhaDigitada("");
    setErro("");
  };

  return (
    <div className="no-print fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Top Header */}
        <div className="bg-[#0b1f5c] px-6 py-6 text-center text-white">
          <img
            src={brasao}
            alt="Grupo Águia Power"
            className="mx-auto h-20 w-auto object-contain drop-shadow"
          />
          <h2 className="mt-3 text-[19px] font-bold tracking-tight">Grupo Águia Power</h2>
          <p className="text-[12px] text-blue-200">
            Acesso ao Sistema Operacional & Check-List
          </p>
        </div>

        <div className="p-6">
          {/* Seletor rápido de técnicos (para agilidade em campo) */}
          <div className="mb-6">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Acesso Rápido por Perfil:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {usuarios.map((u) => {
                const isSelected = usuarioAtual?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selecionarRapido(u)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-left transition active:scale-95 ${
                      isSelected
                        ? "border-[#0b1f5c] bg-blue-50/80 ring-1 ring-[#0b1f5c]"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <p className="truncate text-[13px] font-bold text-slate-800">{u.nome}</p>
                      <span
                        className={`inline-block text-[10px] font-semibold ${
                          u.papel === "gestor" ? "text-purple-700 font-bold" : "text-slate-500"
                        }`}
                      >
                        {u.papel === "gestor" ? "👑 Gestor" : "🔧 Técnico"}
                      </span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-[#0b1f5c]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative mb-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-medium text-slate-400">
              ou entrar com credenciais
            </span>
          </div>

          {/* Formulário com senha */}
          <form onSubmit={autenticarManual} className="space-y-3.5">
            {erro && (
              <div className="rounded-xl bg-red-50 p-2.5 text-center text-[12px] font-semibold text-red-700">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600">
                Usuário / Login
              </label>
              <div className="relative mt-1">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={loginDigitado}
                  onChange={(e) => setLoginDigitado(e.target.value)}
                  placeholder="Ex: gestor ou carlos"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600">
                Senha
              </label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={senhaDigitada}
                  onChange={(e) => setSenhaDigitada(e.target.value)}
                  placeholder="Senha do usuário (padrão: 123)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0b1f5c] py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-blue-900 transition active:scale-95"
              >
                <LogIn className="h-4 w-4" />
                Entrar no Sistema
              </button>
            </div>
          </form>

          {!obrigatorio && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-3 block w-full text-center text-[12px] text-slate-400 hover:text-slate-600"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
