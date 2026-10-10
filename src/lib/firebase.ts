import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
} from "firebase/firestore";
import firebaseConfig from "@/../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection on startup as mandated by Firebase integration guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("[Firebase] Client is offline — will use local cache and sync when online.");
    }
  }
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
}

export interface RegistroFicha {
  id: string;
  atualizado: number;
  dados: any;
}

export async function salvarFichaNuvem(registro: RegistroFicha): Promise<boolean> {
  const path = `fichas/${registro.id}`;
  try {
    const docRef = doc(db, "fichas", registro.id);
    // Remove or compress large non-essential fields if any
    await setDoc(docRef, {
      id: registro.id,
      atualizado: registro.atualizado,
      local: registro.dados.local || "",
      dataHora: registro.dados.dataHora || "",
      sigla: registro.dados.sigla || "",
      lider: registro.dados.lider || "",
      colaborador: registro.dados.colaborador || "",
      marcados: registro.dados.marcados || {},
      outros: !!registro.dados.outros,
      outrosTexto: registro.dados.outrosTexto || "",
      descricao: registro.dados.descricao || "",
      sucesso: !!registro.dados.sucesso,
      naoRealizado: !!registro.dados.naoRealizado,
      motivo: registro.dados.motivo || "",
      motivoDetalhe: registro.dados.motivoDetalhe || "",
      material: registro.dados.material || "",
      materialDetalhe: registro.dados.materialDetalhe || "",
      assTecnico: registro.dados.assTecnico || null,
      assColaborador: registro.dados.assColaborador || null,
      linhas: registro.dados.linhas || [],
      fotos: registro.dados.fotos || [],
      entrada: registro.dados.entrada || null,
      saida: registro.dados.saida || null,
      gpsUrl: registro.dados.gpsUrl || null,
      dados: registro.dados,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function excluirFichaNuvem(id: string): Promise<boolean> {
  const path = `fichas/${id}`;
  try {
    await deleteDoc(doc(db, "fichas", id));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export function escutarFichasNuvem(
  onUpdate: (fichas: RegistroFicha[]) => void
): () => void {
  const colRef = collection(db, "fichas");
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const lista: RegistroFicha[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.id && data.atualizado) {
          lista.push({
            id: data.id,
            atualizado: data.atualizado,
            dados: data.dados || data,
          });
        }
      });
      lista.sort((a, b) => b.atualizado - a.atualizado);
      onUpdate(lista);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, "fichas");
    }
  );

  return unsubscribe;
}
