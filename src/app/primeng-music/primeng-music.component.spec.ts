import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimengMusicComponent } from './primeng-music.component';

describe('PrimengMusicComponent', () => {
  let component: PrimengMusicComponent;
  let fixture: ComponentFixture<PrimengMusicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimengMusicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrimengMusicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
