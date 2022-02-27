import { Component } from '@angular/core';
import { SliderState } from './models/state.model';
import { RapidSliderConfig } from './sliderbar/models/config.model';

type SliderColor = 'gold' | 'teal' | 'brown';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public slider: RapidSliderConfig = {
    value: 0.5,
    ticks: 6,
    snap: false,
    color: 'gold',
  };

  public sliderColor: SliderColor = 'teal';
  public sliderState: SliderState = 'Not Dragging';

  public onSliderChanges(sliderValue: number): void {
    this.slider.value = sliderValue;
  }

  public onSliderDragStarted(): void {
    this.sliderState = 'Dragging';
  }

  public onSliderDragEnded(): void {
    this.sliderState = 'Not Dragging';
  }
}
