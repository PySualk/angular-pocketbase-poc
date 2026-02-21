import { Injectable, OnDestroy, signal, computed, inject } from '@angular/core';
import type { RecordModel } from 'pocketbase';
import { PocketBaseService } from '../pocketbase.service';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly pb = inject(PocketBaseService).client;

  readonly currentUser = signal<RecordModel | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  // authStore.onChange fires outside the Angular zone — signal mutations are safe with signals
  private readonly unsubscribe: () => void;

  constructor() {
    this.unsubscribe = this.pb.authStore.onChange((_token, record) => {
      this.currentUser.set(record as RecordModel | null);
    }, true);
  }

  async register(email: string, password: string, passwordConfirm: string): Promise<void> {
    await this.pb.collection('users').create({ email, password, passwordConfirm });
    await this.pb.collection('users').authWithPassword(email, password);
  }

  async login(email: string, password: string): Promise<void> {
    await this.pb.collection('users').authWithPassword(email, password);
  }

  logout(): void {
    this.pb.authStore.clear();
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.pb.collection('users').requestPasswordReset(email);
  }

  async confirmPasswordReset(
    token: string,
    password: string,
    passwordConfirm: string,
  ): Promise<void> {
    await this.pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }
}
