import { Component } from '@angular/core';
import { SliderState } from './models/state.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public title = 'RapidSliderbar';

  public brownValue = .22;
  public tealValue = .50;
  public goldValue = .87;

  public brownTicks = 6;
  public tealTicks = 11;
  public goldTicks = 41;

  public brownIsSnapped = false;
  public tealIsSnapped = true;
  public goldIsSnapped = false;

  public sliderState: SliderState = 'Not Dragging';

  public onBrownSliderChanges(sliderValue: number): void {
    this.brownValue = sliderValue;
  }
  public onTealSliderChanges(sliderValue: number): void {
    this.tealValue = sliderValue;
  }
  public onGoldSliderChanges(sliderValue: number): void {
    this.goldValue = sliderValue;
  }

  public onSliderDragStarted(): void {
    this.sliderState = 'Dragging';
  }

  public onSliderDragEnded(): void {
    this.sliderState = 'Not Dragging';
  }
}
