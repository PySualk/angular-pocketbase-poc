import { TestBed } from '@angular/core/testing';
import { PocketBaseService } from '../pocketbase.service';
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

const makeCollectionApi = (overrides: Record<string, unknown> = {}) => ({
  getList: vi.fn().mockResolvedValue({ items: [] }),
  create: vi.fn().mockResolvedValue(makeTodo()),
  update: vi.fn().mockResolvedValue(makeTodo()),
  delete: vi.fn().mockResolvedValue(undefined),
  subscribe: vi.fn().mockResolvedValue(() => {}),
  ...overrides,
});

describe('TodoService', () => {
  let service: TodoService;
  let collectionSpy: ReturnType<typeof vi.fn>;
  let collectionApi: ReturnType<typeof makeCollectionApi>;

  beforeEach(() => {
    collectionApi = makeCollectionApi();
    collectionSpy = vi.fn().mockReturnValue(collectionApi);

    TestBed.configureTestingModule({
      providers: [
        TodoService,
        { provide: PocketBaseService, useValue: { client: { collection: collectionSpy } } },
      ],
    });
    service = TestBed.inject(TodoService);
  });

  describe('initial state', () => {
    it('should have empty todos signal on init', () => {
      expect(service.todos()).toEqual([]);
    });

    it('should have loading false on init', () => {
      expect(service.loading()).toBe(false);
    });
  });

  describe('load()', () => {
    it('should populate todos from PocketBase getList', async () => {
      const todos = [makeTodo({ id: '1', title: 'First' }), makeTodo({ id: '2', title: 'Second' })];
      const api = makeCollectionApi({ getList: vi.fn().mockResolvedValue({ items: todos }) });
      collectionSpy.mockReturnValue(api);

      await service.load();

      expect(service.todos().length).toBe(2);
    });

    it('should throw on network error', async () => {
      const api = makeCollectionApi({ getList: vi.fn().mockRejectedValue(new Error('network error')) });
      collectionSpy.mockReturnValue(api);

      await expect(service.load()).rejects.toThrow();
    });
  });

  describe('create()', () => {
    it('should call pb.collection("todos").create() with title and completed false', async () => {
      const createFn = vi.fn().mockResolvedValue(makeTodo({ title: 'New todo' }));
      const api = makeCollectionApi({ create: createFn });
      collectionSpy.mockReturnValue(api);

      await service.create('New todo');

      expect(collectionSpy).toHaveBeenCalledWith('todos');
      expect(createFn).toHaveBeenCalledWith({ title: 'New todo', completed: false });
    });

    it('should throw when title is empty', async () => {
      await expect(service.create('')).rejects.toThrow();
    });

    it('should throw when title is whitespace only', async () => {
      await expect(service.create('   ')).rejects.toThrow();
    });

    it('should throw when title exceeds 200 chars', async () => {
      await expect(service.create('a'.repeat(201))).rejects.toThrow();
    });

    it('should trim title before creating', async () => {
      const createFn = vi.fn().mockResolvedValue(makeTodo());
      const api = makeCollectionApi({ create: createFn });
      collectionSpy.mockReturnValue(api);

      await service.create('  Buy milk  ');

      expect(createFn).toHaveBeenCalledWith({ title: 'Buy milk', completed: false });
    });
  });

  describe('toggleTodo()', () => {
    it('should call pb.collection("todos").update(id, { completed })', async () => {
      const updateFn = vi.fn().mockResolvedValue(makeTodo({ completed: true }));
      const api = makeCollectionApi({ update: updateFn });
      collectionSpy.mockReturnValue(api);

      await service.toggleTodo('abc', true);

      expect(collectionSpy).toHaveBeenCalledWith('todos');
      expect(updateFn).toHaveBeenCalledWith('abc', { completed: true });
    });
  });

  describe('deleteTodo()', () => {
    it('should call pb.collection("todos").delete(id)', async () => {
      const deleteFn = vi.fn().mockResolvedValue(undefined);
      const api = makeCollectionApi({ delete: deleteFn });
      collectionSpy.mockReturnValue(api);

      await service.deleteTodo('abc');

      expect(collectionSpy).toHaveBeenCalledWith('todos');
      expect(deleteFn).toHaveBeenCalledWith('abc');
    });
  });

  describe('realtime subscription', () => {
    it('should append new record on create event', async () => {
      const newTodo = makeTodo({ id: 'new1', title: 'New from SSE' });
      let eventCallback: (event: { action: string; record: Todo }) => void = () => {};
      const subscribeFn = vi.fn().mockImplementation(
        (_: string, cb: typeof eventCallback) => {
          eventCallback = cb;
          return Promise.resolve(() => {});
        },
      );
      const api = makeCollectionApi({
        getList: vi.fn().mockResolvedValue({ items: [] }),
        subscribe: subscribeFn,
      });
      collectionSpy.mockReturnValue(api);

      await service.load();
      eventCallback({ action: 'create', record: newTodo });

      expect(service.todos().some((t) => t.id === 'new1')).toBe(true);
    });

    it('should replace existing record on update event', async () => {
      const existing = makeTodo({ id: 'e1', title: 'Existing', completed: false });
      const updated = { ...existing, completed: true };
      let eventCallback: (event: { action: string; record: Todo }) => void = () => {};
      const subscribeFn = vi.fn().mockImplementation(
        (_: string, cb: typeof eventCallback) => {
          eventCallback = cb;
          return Promise.resolve(() => {});
        },
      );
      const api = makeCollectionApi({
        getList: vi.fn().mockResolvedValue({ items: [existing] }),
        subscribe: subscribeFn,
      });
      collectionSpy.mockReturnValue(api);

      await service.load();
      eventCallback({ action: 'update', record: updated });

      const found = service.todos().find((t) => t.id === 'e1');
      expect(found?.completed).toBe(true);
    });

    it('should remove record on delete event', async () => {
      const existing = makeTodo({ id: 'd1', title: 'To delete' });
      let eventCallback: (event: { action: string; record: Todo }) => void = () => {};
      const subscribeFn = vi.fn().mockImplementation(
        (_: string, cb: typeof eventCallback) => {
          eventCallback = cb;
          return Promise.resolve(() => {});
        },
      );
      const api = makeCollectionApi({
        getList: vi.fn().mockResolvedValue({ items: [existing] }),
        subscribe: subscribeFn,
      });
      collectionSpy.mockReturnValue(api);

      await service.load();
      eventCallback({ action: 'delete', record: existing });

      expect(service.todos().some((t) => t.id === 'd1')).toBe(false);
    });

    it('should call unsubscribe on ngOnDestroy', async () => {
      const unsubscribeFn = vi.fn();
      const subscribeFn = vi.fn().mockResolvedValue(unsubscribeFn);
      const api = makeCollectionApi({
        getList: vi.fn().mockResolvedValue({ items: [] }),
        subscribe: subscribeFn,
      });
      collectionSpy.mockReturnValue(api);

      await service.load();
      service.ngOnDestroy();

      expect(unsubscribeFn).toHaveBeenCalled();
    });
  });
});
