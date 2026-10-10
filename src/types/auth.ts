export type PapelUsuario = "gestor" | "tecnico";

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  senha: string;
  cargo: string;
  papel: PapelUsuario;
  telefone?: string;
  ativo: boolean;
}

export const USUARIOS_INICIAIS: Usuario[] = [
  {
    id: "usr-gestor",
    nome: "Coordenação Águia Power",
    login: "gestor",
    senha: "123",
    cargo: "Supervisor de TI & Operações",
    papel: "gestor",
    telefone: "(11) 99999-0001",
    ativo: true,
  },
  {
    id: "usr-tec-1",
    nome: "Carlos Silva",
    login: "carlos",
    senha: "123",
    cargo: "Técnico TI Águia Power",
    papel: "tecnico",
    telefone: "(11) 98888-1111",
    ativo: true,
  },
  {
    id: "usr-tec-2",
    nome: "Marcos Oliveira",
    login: "marcos",
    senha: "123",
    cargo: "Técnico CFTV & Redes",
    papel: "tecnico",
    telefone: "(11) 98888-2222",
    ativo: true,
  },
  {
    id: "usr-tec-3",
    nome: "Lucas Pereira",
    login: "lucas",
    senha: "123",
    cargo: "Técnico de Manutenção",
    papel: "tecnico",
    telefone: "(11) 98888-3333",
    ativo: true,
  },
];
