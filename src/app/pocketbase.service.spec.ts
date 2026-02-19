import { TestBed } from '@angular/core/testing';
import PocketBase from 'pocketbase';
import { PocketBaseService } from './pocketbase.service';

describe('PocketBaseService', () => {
  let service: PocketBaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PocketBaseService);
  });

  it('should be injectable', () => {
    expect(service).toBeTruthy();
  });

  it('should expose a PocketBase client instance', () => {
    expect(service.client).toBeInstanceOf(PocketBase);
  });

  it('should point the client at the environment pocketbaseUrl', () => {
    expect(service.client.baseURL).toBe('http://localhost:8080');
  });
});
