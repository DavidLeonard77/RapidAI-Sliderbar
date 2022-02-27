import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderbarComponent } from './sliderbar.component';

describe('SliderbarComponent', () => {
  let component: SliderbarComponent;
  let fixture: ComponentFixture<SliderbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SliderbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SliderbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
