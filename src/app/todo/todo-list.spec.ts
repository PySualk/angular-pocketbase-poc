import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TodoListComponent } from './todo-list';
import { TodoService } from './todo.service';
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

  beforeEach(async () => {
    todosSignal = signal<Todo[]>([]);
    loadingSignal = signal<boolean>(false);
    createFn = vi.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        {
          provide: TodoService,
          useValue: {
            todos: todosSignal,
            loading: loadingSignal,
            create: createFn,
            toggleTodo: vi.fn().mockResolvedValue(undefined),
            deleteTodo: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    fixture.detectChanges();
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

  it('should show create form with accessible label', () => {
    const el = fixture.nativeElement as HTMLElement;
    const label = el.querySelector('label[for]');
    expect(label).toBeTruthy();
  });
});
