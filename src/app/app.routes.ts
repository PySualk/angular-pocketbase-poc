import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./todo/todo-list').then((m) => m.TodoListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register/register').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'auth/confirm-reset',
    loadComponent: () =>
      import('./auth/confirm-reset/confirm-reset').then((m) => m.ConfirmResetComponent),
  },
  { path: '**', redirectTo: '' },
];
