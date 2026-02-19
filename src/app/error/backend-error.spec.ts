import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackendErrorComponent } from './backend-error';

describe('BackendErrorComponent', () => {
  let fixture: ComponentFixture<BackendErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackendErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BackendErrorComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should contain a message indicating the backend is unavailable', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toMatch(/cannot connect|backend|docker/i);
  });
});
