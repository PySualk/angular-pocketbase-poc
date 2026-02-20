import { Component } from '@angular/core';

@Component({
  selector: 'app-backend-error',
  template: `
    <div class="flex min-h-screen items-center justify-center p-8">
      <div class="text-center">
        <p class="text-xl font-semibold text-red-600">Cannot connect to backend.</p>
        <p class="mt-2 text-gray-600">Make sure Docker is running.</p>
      </div>
    </div>
  `,
})
export class BackendErrorComponent {}
