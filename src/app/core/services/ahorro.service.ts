//Este servicio se encarga de manejar las operaciones relacionadas con los registros de ahorro, como crear, leer, actualizar y eliminar registros en Firestore.

import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase/firebase.config';
import { AhorroRecord } from '../models/ahorro-record.model';

@Injectable({
  providedIn: 'root',
})
export class AhorroService {
  private readonly collectionName = 'ahorros';

  constructor() {}

  async crearAhorro(ahorro: Omit<AhorroRecord, 'id' | 'createdAt'>): Promise<void> {
    const ahorrosRef = collection(db, this.collectionName);

    await addDoc(ahorrosRef, {
      ...ahorro,
      createdAt: serverTimestamp(),
    });
  }

  async obtenerAhorrosPorUsuario(uid: string): Promise<AhorroRecord[]> {
    const ahorrosRef = collection(db, this.collectionName);

    const q = query(ahorrosRef, where('uid', '==', uid), orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AhorroRecord[];
  }

  async actualizarAhorro(
    id: string,
    ahorro: Omit<AhorroRecord, 'id' | 'uid' | 'displayName' | 'email' | 'createdAt'>,
  ): Promise<void> {
    const ahorroDocRef = doc(db, this.collectionName, id);

    await updateDoc(ahorroDocRef, {
      ...ahorro,
    });
  }
}
