import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { SvgCircle, SvgLine, SvgText } from './models/svg.model';

export type ComponentChange<T, P extends keyof T> = {
  previousValue: T[P];
  currentValue: T[P];
  firstChange: boolean;
};

export type ComponentChanges<T> = {
  [P in keyof T]?: ComponentChange<T, P>;
};

@Component({
  selector: 'rapid-sliderbar',
  templateUrl: './sliderbar.component.html',
  styleUrls: ['./sliderbar.component.scss'],
})
export class SliderbarComponent implements OnChanges, OnInit {
  @Input() name: string | undefined;
  @Input() value: number | undefined;
  @Input() ticks: number | undefined;
  @Input() snap: boolean | undefined;

  @Output() dragStarted = new EventEmitter<void>();
  @Output() dragEnded = new EventEmitter<void>();
  @Output() valueChange = new EventEmitter<number>();

  @ViewChild('valueSlider', { static: false }) valueSliderRef:
    | ElementRef<SVGSVGElement>
    | undefined;
  @ViewChild('thumb', { static: false }) thumbRef:
    | ElementRef<SVGGraphicsElement>
    | undefined;

  public tickValue = 0;

  private thumb: SVGGraphicsElement | undefined;

  public dragging = false;

  public thumbSvg: SvgCircle = {
    cx: 0,
    cy: 50,
  };

  public rangeTrackSvg: SvgLine = {
    x1: 0,
    y1: 50,
    x2: 0,
    y2: 50,
  };

  public backgroundTrackSvg: SvgLine = {
    x1: 0,
    y1: 50,
    x2: 100,
    y2: 50,
  };

  public tickSvgs: Array<SvgLine> = [];
  public tickLabelSvgs: Array<SvgText> = [];

  constructor() {}

  public ngOnChanges(changes: ComponentChanges<SliderbarComponent>): void {
    if (this.valueSliderRef) {
      const currentValue: number | undefined = changes?.value?.currentValue;
      const currentTicks: number | undefined = changes?.ticks?.currentValue;
      const currentSnap: boolean | undefined = changes?.snap?.currentValue;

      const percent: number = this.getPercentInRange(this.value);
      const position: number = this.getPositionFromPercent(percent);

      // ticks value changes
      if (
        currentTicks !== undefined &&
        currentTicks !== changes.ticks?.previousValue
      ) {
        this.setNearestTickValue(this.value);
        this.createTicksAndSetPositions(currentTicks);
        setTimeout(() => this.emitHandlePosition(position));
      }

      // snap value changes
      if (
        currentSnap !== undefined &&
        currentSnap !== changes.snap?.previousValue
      ) {
        this.setNearestTickValue(this.value);
        setTimeout(() => this.emitHandlePosition(position));
      }

      // percent value changes
      if (
        currentValue !== undefined &&
        currentValue !== changes.value?.previousValue
      ) {
        this.setNearestTickValue(this.value);
        this.setHandlePosition(position);
      }
    }
  }

  public ngOnInit(): void {
    const percent: number = this.getPercentInRange(this.value);
    const position: number = this.getPositionFromPercent(percent);

    this.setNearestTickValue(this.value);
    this.createTicksAndSetPositions(this.ticks || 2);
    this.setHandlePosition(position);
  }

  @HostListener('document:mousedown', ['$event'])
  mouseDown(mouseEvent: MouseEvent): void {
    if (this.pointerTargetIsSlider(mouseEvent)) {
      this.startDragging(mouseEvent);
      const pointerPosition: number = this.getMousePosition(mouseEvent);
      this.setAndEmitChangesFromUserInput(pointerPosition);
    }
  }

  @HostListener('document:touchstart', ['$event'])
  touchStart(touchEvent: TouchEvent): void {
    if (this.pointerTargetIsSlider(touchEvent)) {
      this.startDragging(touchEvent);
      const pointerPosition: number = this.getTouchPosition(touchEvent);
      this.setAndEmitChangesFromUserInput(pointerPosition);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  mouseMove(mouseEvent: MouseEvent): void {
    if (this.dragging) {
      mouseEvent.preventDefault();
      const pointerPosition: number = this.getMousePosition(mouseEvent);
      this.setAndEmitChangesFromUserInput(pointerPosition);
    }
  }

  @HostListener('document:touchmove', ['$event'])
  touchMove(touchEvent: TouchEvent): void {
    if (this.dragging) {
      const pointerPosition: number = this.getTouchPosition(touchEvent);
      this.setAndEmitChangesFromUserInput(pointerPosition);
    }
  }

  @HostListener('document:touchend', ['$event'])
  touchEnd(): void {
    this.endDragging();
  }

  @HostListener('document:mouseup', ['$event'])
  mouseUp(): void {
    this.endDragging();
  }

  @HostListener('document:mouseleave', ['$event'])
  mouseLeave(): void {
    this.endDragging();
  }

  // Expects a number (length)
  private createTicksAndSetPositions(length: number): void {
    if (length < 2) return;

    const tickWidth = +this.backgroundTrackSvg.x2 / (length - 1);
    let position,
      value = 0;
    this.tickSvgs = [];
    this.tickLabelSvgs = [];

    for (let index = 0; index < length; index++) {
      position = tickWidth * index;
      value = Math.round(position);
      this.tickSvgs.push({
        x1: position,
        y1: 30,
        x2: position,
        y2: 70,
      });

      // center alignment is not available so we need to shift the labels
      const labelLength = Math.round(position).toString().length;
      const labelPosition =
        position - ((labelLength === 1 ? 0 : labelLength) + 2) * 0.2;
      this.tickLabelSvgs.push({
        value,
        x: labelPosition,
        y: 150,
      });
    }
  }

  // Expects a number (percent)
  // Returns a number (percent) between 0 and 1
  private getPercentInRange(currentValue: number | undefined): number {
    if (currentValue === undefined) return 0;
    let percent = 0;
    if (currentValue > 0) percent = currentValue;
    if (currentValue > 1) percent = 1;
    return percent;
  }

  // Expects a number (pixels)
  // Sets the handle position (percent)
  private setHandlePosition(position: number): void {
    const width = this.backgroundTrackSvg.x2;
    const percent = (this.getPercentFromPosition(position) * +width) / 100;
    const x = this.getNearestTickPercent(percent) * 100;

    this.thumbSvg.cx = x;
    this.rangeTrackSvg.x2 = x;
  }

  // Expects a number (pixels)
  // Emits a number (percent) for the handle position
  private emitHandlePosition(position: number): void {
    let percent: number = this.getPercentFromPosition(position);
    percent = this.getNearestTickPercent(percent);

    this.valueChange.next(percent);
  }

  // Expects a number (pixels) from the pointer
  // Sets and Emits a number (percent) for the handle position
  private setAndEmitChangesFromUserInput(pointerPosition: number): void {
    const position: number = this.getHandlePositionFromMatrix(pointerPosition);
    const maxPixels: number = this.getSliderWidth();

    // handle cannot slide off the track
    if (position > 0 && position < maxPixels) {
      this.setHandlePosition(position);
      this.emitHandlePosition(position);
    }
  }

  // Returns a boolean (true) when mouse target is over the current named slider
  private pointerTargetIsSlider(event: MouseEvent | TouchEvent): boolean {
    const target = event.target as SVGGraphicsElement;
    return (
      target.classList.contains('slider') &&
      target.classList.contains(this.name || '')
    );
  }

  // Starts the drag state and emits
  private startDragging(event: MouseEvent | TouchEvent): void {
    this.dragging = true;
    this.thumb = event.target as SVGGraphicsElement;
    this.dragStarted.next();
  }

  // Ends the drag state and emits
  private endDragging(): void {
    if (this.dragging) {
      this.dragging = false;
      this.dragEnded.next();
    }
  }

  // Expects a touchEvent
  // Returns a number (pixels) from the first touch relative to the document
  private getTouchPosition(touchEvent: TouchEvent): number {
    return touchEvent.targetTouches[0].clientX;
  }

  // Expects a mouseEvent
  // Returns a number (pixels) from the mouse event relative to the document
  private getMousePosition(mouseEvent: MouseEvent): number {
    return mouseEvent.clientX;
  }

  // Expects a number (pixels) relative to the document
  // Returns a number (pixels) relative to the slider
  private getHandlePositionFromMatrix(pointerPosition: number): number {
    const matrix: DOMMatrix | null | undefined = this.thumb?.getScreenCTM();
    if (!matrix) return 0;
    return (pointerPosition - matrix.e) / matrix.a;
  }

  // Returns a number (position) between 0 and the width of the slider element
  private getPositionFromPercent(percent: number): number {
    return percent * this.getSliderWidth();
  }

  // Expects a number (pixels) between 0 and the width of the slider element
  // Returns a number (percent) between 0 and 1
  private getPercentFromPosition(position: number): number {
    const width: number = this.getSliderWidth();
    return position / width;
  }

  // Expects a number (pixels)
  // Returns a number (percent)
  private getNearestTickPercent(percent: number): number {
    if (this.snap && this.tickSvgs.length > 1) {
      const closestTickSvg: SvgLine = this.tickSvgs.reduce(
        (a: SvgLine, b: SvgLine) =>
          Math.abs(+b.x1 - percent * 100) < Math.abs(+a.x1 - percent * 100)
            ? b
            : a
      );

      return Math.round(+closestTickSvg.x1) / 100;
    }
    return percent;
  }

  // Expects a number (percent)
  // Sets the tick label (number) to compare against
  private setNearestTickValue(percent: number | undefined): void {
    const currentTickValue = percent !== undefined ? percent : 0.5;
    const nearestTickValue = this.getNearestTickPercent(currentTickValue);
    this.tickValue = Math.round(nearestTickValue * 100);
  }

  // Returns a number (pixels)
  private getSliderWidth(): number {
    return this.valueSliderRef?.nativeElement.width.baseVal.value || 1;
  }
}
