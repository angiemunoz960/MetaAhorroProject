import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private authService = inject(AuthService);

  user$ = this.authService.user$;

  async login() {
    try {
      await this.authService.loginWithGoogle();
      console.log('Inicio de sesión exitoso');
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      console.log('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
