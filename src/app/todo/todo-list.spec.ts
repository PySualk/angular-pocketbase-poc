import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { TodoListComponent } from './todo-list';
import { TodoService } from './todo.service';
import { AuthService } from '../auth/auth.service';
import { Todo } from './todo';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'abc',
  title: 'Test todo',
  completed: false,
  created: '2026-02-19T10:00:00.000Z',
  updated: '2026-02-19T10:00:00.000Z',
  ...overrides,
});

describe('TodoListComponent', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let todosSignal: ReturnType<typeof signal<Todo[]>>;
  let loadingSignal: ReturnType<typeof signal<boolean>>;
  let createFn: ReturnType<typeof vi.fn>;
  let loadFn: ReturnType<typeof vi.fn>;
  let logoutFn: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(async () => {
    todosSignal = signal<Todo[]>([]);
    loadingSignal = signal<boolean>(false);
    createFn = vi.fn().mockResolvedValue(undefined);
    loadFn = vi.fn().mockResolvedValue(undefined);
    logoutFn = vi.fn();

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        provideRouter([]),
        {
          provide: TodoService,
          useValue: {
            todos: todosSignal,
            loading: loadingSignal,
            create: createFn,
            load: loadFn,
            toggleTodo: vi.fn().mockResolvedValue(undefined),
            deleteTodo: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'u1', email: 'test@example.com' }),
            isAuthenticated: signal(true),
            logout: logoutFn,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should call todoService.load() on init', () => {
    expect(loadFn).toHaveBeenCalled();
  });

  it('should display the current user email', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('test@example.com');
  });

  it('should show empty state message when todos is empty', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No todos yet');
  });

  it('should show loading indicator while loading', () => {
    loadingSignal.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent?.toLowerCase()).toContain('loading');
  });

  it('should render one app-todo-item per todo', () => {
    todosSignal.set([makeTodo({ id: '1', title: 'First' }), makeTodo({ id: '2', title: 'Second' })]);
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('app-todo-item');
    expect(items.length).toBe(2);
  });

  it('should call TodoService.create() on valid submit', async () => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="text"]')!;
    const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
    input.value = 'Buy milk';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(createFn).toHaveBeenCalledWith('Buy milk');
  });

  it('should show validation message and not call create() on blank title', async () => {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(createFn).not.toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toMatch(/title.*required|required|cannot be empty/i);
  });

  it('should show validation message for title over 200 chars', async () => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="text"]')!;
    const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
    input.value = 'a'.repeat(201);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(createFn).not.toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toMatch(/200|too long|max/i);
  });

  it('should call authService.logout() and navigate to /auth/login when sign out is clicked', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const signOutBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="sign-out"]');
    expect(signOutBtn).toBeTruthy();
    signOutBtn!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(logoutFn).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should show BackendErrorComponent on load failure', async () => {
    loadFn = vi.fn().mockRejectedValue(new Error('network error'));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        provideRouter([]),
        {
          provide: TodoService,
          useValue: {
            todos: todosSignal,
            loading: loadingSignal,
            create: createFn,
            load: loadFn,
            toggleTodo: vi.fn(),
            deleteTodo: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'u1', email: 'test@example.com' }),
            isAuthenticated: signal(true),
            logout: logoutFn,
          },
        },
      ],
    }).compileComponents();

    const f = TestBed.createComponent(TodoListComponent);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();

    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('app-backend-error')).toBeTruthy();
  });
});
