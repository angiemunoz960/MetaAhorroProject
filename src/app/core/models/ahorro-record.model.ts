//Un modelo es una interfaz que define la estructura de un objeto.

export interface AhorroRecord {
  id?: string; // id del documento Firestore
  uid: string;
  displayName: string;
  email: string;

  nombreAhorro: string;
  descripcionAhorro: string;

  ahorroMensual: number;
  meses: number;
  meta: number;

  ahorroTotal: number;
  cumplioMeta: boolean;
  diferenciaMeta: number;

  createdAt: unknown;
}
