import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomaudioComponent } from './customaudio.component';

describe('CustomaudioComponent', () => {
  let component: CustomaudioComponent;
  let fixture: ComponentFixture<CustomaudioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomaudioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomaudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
