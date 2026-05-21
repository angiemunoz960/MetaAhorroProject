import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import { auth } from '../firebase/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable();

  private authInitializedSubject = new BehaviorSubject<boolean>(false);
  readonly authInitialized$ = this.authInitializedSubject.asObservable();

  private ngZone = inject(NgZone);

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.ngZone.run(() => {
        this.userSubject.next(user);
        this.authInitializedSubject.next(true);
      });
    });
  }

  // Devuelve el usuario actual o null si no hay ningún usuario autenticado
  get currentUser(): User | null {
    return this.userSubject.value;
  }

  // Devuelve true si el proceso de autenticación se ha inicializado, false en caso contrario
  get isAuthInitialized(): boolean {
    return this.authInitializedSubject.value;
  }

  // Método para iniciar sesión con Google utilizando un popup
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Método para cerrar sesión
  async logout() {
    return signOut(auth);
  }
}
