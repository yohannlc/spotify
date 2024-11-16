import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimengPlaylistComponent } from './primeng-playlist.component';

describe('PrimengPlaylistComponent', () => {
  let component: PrimengPlaylistComponent;
  let fixture: ComponentFixture<PrimengPlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimengPlaylistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrimengPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
