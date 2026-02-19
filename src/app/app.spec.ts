import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { TodoService } from './todo/todo.service';
import { signal } from '@angular/core';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let loadFn: ReturnType<typeof vi.fn>;

  const setup = async (loadImpl: () => Promise<void>) => {
    loadFn = vi.fn().mockImplementation(loadImpl);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: TodoService,
          useValue: {
            todos: signal([]),
            loading: signal(false),
            load: loadFn,
            create: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
  };

  it('should call TodoService.load() on init', async () => {
    await setup(() => Promise.resolve());
    fixture.detectChanges();
    await fixture.whenStable();
    expect(loadFn).toHaveBeenCalled();
  });

  it('should render app-todo-list when load() resolves', async () => {
    await setup(() => Promise.resolve());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-todo-list')).toBeTruthy();
    expect(el.querySelector('app-backend-error')).toBeNull();
  });

  it('should render app-backend-error and no app-todo-list when load() rejects', async () => {
    await setup(() => Promise.reject(new Error('network error')));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-backend-error')).toBeTruthy();
    expect(el.querySelector('app-todo-list')).toBeNull();
  });
});
