import { TestBed } from '@angular/core/testing';
import { PocketBaseService } from '../pocketbase.service';
import { AuthService } from './auth.service';

const makeAuthStore = (overrides: Record<string, unknown> = {}) => ({
  record: null,
  isValid: false,
  onChange: vi.fn().mockReturnValue(() => {}),
  clear: vi.fn(),
  ...overrides,
});

const makeCollectionApi = (overrides: Record<string, unknown> = {}) => ({
  create: vi.fn().mockResolvedValue({ id: 'user1', email: 'test@example.com' }),
  authWithPassword: vi.fn().mockResolvedValue({ record: { id: 'user1', email: 'test@example.com' } }),
  requestPasswordReset: vi.fn().mockResolvedValue(undefined),
  confirmPasswordReset: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let authStore: ReturnType<typeof makeAuthStore>;
  let collectionSpy: ReturnType<typeof vi.fn>;
  let collectionApi: ReturnType<typeof makeCollectionApi>;

  beforeEach(() => {
    authStore = makeAuthStore();
    collectionApi = makeCollectionApi();
    collectionSpy = vi.fn().mockReturnValue(collectionApi);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: PocketBaseService,
          useValue: { client: { collection: collectionSpy, authStore } },
        },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('currentUser signal', () => {
    it('should initialise currentUser from authStore.record', () => {
      const record = { id: 'u1', email: 'a@b.com' };
      authStore = makeAuthStore({ record });
      let changeCallback: (token: string, record: unknown) => void = () => {};
      authStore.onChange = vi.fn().mockImplementation((cb: typeof changeCallback, _fire: boolean) => {
        changeCallback = cb;
        cb('token', record);
        return () => {};
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          {
            provide: PocketBaseService,
            useValue: { client: { collection: collectionSpy, authStore } },
          },
        ],
      });
      const svc = TestBed.inject(AuthService);
      expect(svc.currentUser()).toEqual(record);
    });

    it('should call authStore.onChange with fireImmediately=true', () => {
      expect(authStore.onChange).toHaveBeenCalledWith(expect.any(Function), true);
    });

    it('should update currentUser signal when onChange fires', () => {
      let changeCallback: (token: string, record: unknown) => void = () => {};
      authStore.onChange = vi.fn().mockImplementation((cb: typeof changeCallback, _fire: boolean) => {
        changeCallback = cb;
        cb('', null);
        return () => {};
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: PocketBaseService, useValue: { client: { collection: collectionSpy, authStore } } },
        ],
      });
      const svc = TestBed.inject(AuthService);

      const newRecord = { id: 'u2', email: 'new@example.com' };
      changeCallback('newtoken', newRecord);
      expect(svc.currentUser()).toEqual(newRecord);
    });
  });

  describe('isAuthenticated computed', () => {
    it('should be false when currentUser is null', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should be true when currentUser is not null', () => {
      const record = { id: 'u1', email: 'a@b.com' };
      let changeCallback: (token: string, record: unknown) => void = () => {};
      authStore.onChange = vi.fn().mockImplementation((cb: typeof changeCallback) => {
        changeCallback = cb;
        cb('', null);
        return () => {};
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: PocketBaseService, useValue: { client: { collection: collectionSpy, authStore } } },
        ],
      });
      const svc = TestBed.inject(AuthService);
      changeCallback('token', record);
      expect(svc.isAuthenticated()).toBe(true);
    });
  });

  describe('register()', () => {
    it('should call pb.collection("users").create() with email, password, passwordConfirm', async () => {
      await service.register('test@example.com', 'password123', 'password123');
      expect(collectionSpy).toHaveBeenCalledWith('users');
      expect(collectionApi.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      });
    });

    it('should call authWithPassword after create', async () => {
      await service.register('test@example.com', 'password123', 'password123');
      expect(collectionApi.authWithPassword).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should propagate errors from create()', async () => {
      collectionApi.create = vi.fn().mockRejectedValue(new Error('Email already in use'));
      await expect(service.register('test@example.com', 'pw', 'pw')).rejects.toThrow();
    });
  });

  describe('login()', () => {
    it('should call pb.collection("users").authWithPassword(email, password)', async () => {
      await service.login('test@example.com', 'password123');
      expect(collectionSpy).toHaveBeenCalledWith('users');
      expect(collectionApi.authWithPassword).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should propagate errors from authWithPassword()', async () => {
      collectionApi.authWithPassword = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
      await expect(service.login('test@example.com', 'wrongpw')).rejects.toThrow();
    });
  });

  describe('logout()', () => {
    it('should call pb.authStore.clear()', () => {
      service.logout();
      expect(authStore.clear).toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset()', () => {
    it('should call pb.collection("users").requestPasswordReset(email)', async () => {
      await service.requestPasswordReset('test@example.com');
      expect(collectionSpy).toHaveBeenCalledWith('users');
      expect(collectionApi.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('confirmPasswordReset()', () => {
    it('should call pb.collection("users").confirmPasswordReset(token, password, passwordConfirm)', async () => {
      await service.confirmPasswordReset('mytoken', 'newpass123', 'newpass123');
      expect(collectionSpy).toHaveBeenCalledWith('users');
      expect(collectionApi.confirmPasswordReset).toHaveBeenCalledWith('mytoken', 'newpass123', 'newpass123');
    });
  });

  describe('ngOnDestroy()', () => {
    it('should call the unsubscribe function returned by authStore.onChange', () => {
      const unsubscribeFn = vi.fn();
      authStore.onChange = vi.fn().mockReturnValue(unsubscribeFn);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: PocketBaseService, useValue: { client: { collection: collectionSpy, authStore } } },
        ],
      });
      const svc = TestBed.inject(AuthService);
      svc.ngOnDestroy();
      expect(unsubscribeFn).toHaveBeenCalled();
    });
  });
});
