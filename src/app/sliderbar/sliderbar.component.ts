import {
  AfterViewInit,
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
import { SvgCircle, SvgLine } from './models/svg.model';

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
  @Input() name = 'rapid-sliderbar';
  @Input() percent = 0.5;
  @Input() ticks = 0;
  @Input() snap = false;

  @Output() dragStarted = new EventEmitter<void>();
  @Output() dragEnded = new EventEmitter<void>();
  @Output() percentChange = new EventEmitter<number>();

  @ViewChild('valueSlider', { static: false }) valueSliderRef:
    | ElementRef<SVGSVGElement>
    | undefined;
  @ViewChild('thumb', { static: false }) thumbRef:
    | ElementRef<SVGGraphicsElement>
    | undefined;

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

  constructor() {}

  public ngOnChanges(changes: ComponentChanges<SliderbarComponent>): void {
    if (this.valueSliderRef) {
      const currentPercent: number | undefined = changes?.percent?.currentValue;
      const currentTicks: number | undefined = changes?.ticks?.currentValue;
      const currentSnap: boolean | undefined = changes?.snap?.currentValue;

      // ticks value changes
      if (
        currentTicks !== undefined &&
        currentTicks !== changes.ticks?.previousValue
      ) {
        this.createTicksAndSetPositions(currentTicks);
        const percent: number = this.getPercentInRange(this.percent);
        const position: number = this.getPositionFromPercent(percent);

        // tick change detection
        setTimeout(() => this.emitHandlePercent(position));
      }

      // snap value changes
      if (
        currentSnap !== undefined &&
        currentSnap !== changes.snap?.previousValue
      ) {
        const percent: number = this.getPercentInRange(this.percent);
        const position: number = this.getPositionFromPercent(percent);

        // tick change detection
        setTimeout(() => this.emitHandlePercent(position));
      }

      // percent value changes
      if (
        currentPercent !== undefined &&
        currentPercent !== changes.percent?.previousValue
      ) {
        const percent: number = this.getPercentInRange(currentPercent);
        const position: number = this.getPositionFromPercent(percent);
        this.setHandlePosition(position);
      }
    }
  }

  public ngOnInit(): void {
    const percent: number = this.getPercentInRange(this.percent);
    const position: number = this.getPositionFromPercent(percent);
    this.createTicksAndSetPositions(this.ticks);
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

    const tickWidth = this.backgroundTrackSvg.x2 / (length - 1);
    let position = 0;
    this.tickSvgs = [];

    for (let index = 0; index < length; index++) {
      position = tickWidth * index;
      this.tickSvgs.push({
        x1: position,
        y1: 0,
        x2: position,
        y2: 100,
      });
    }
  }

  // Expects a number (percent)
  // Returns a number (percent) between 0 and 1
  private getPercentInRange(currentValue: number): number {
    let percent = 0;
    if (currentValue > 0) percent = currentValue;
    if (currentValue > 1) percent = 1;
    return percent;
  }

  // Expects a number (pixels)
  // Sets the handle position (percent)
  private setHandlePosition(position: number): void {
    const width = this.backgroundTrackSvg.x2;
    const percent = (this.getPercentFromPosition(position) * width) / 100;
    const x = this.getNearestTickPercent(percent) * 100;

    this.thumbSvg.cx = x;
    this.rangeTrackSvg.x2 = x;
  }

  // Expects a number (pixels)
  // Emits a number (percent) for the handle position
  private emitHandlePercent(position: number): void {
    let percent: number = this.getPercentFromPosition(position);
    percent = this.getNearestTickPercent(percent);

    this.percentChange.next(percent);
  }

  // Expects a number (pixels) from the pointer
  // Sets and Emits a number (percent) for the handle position
  private setAndEmitChangesFromUserInput(pointerPosition: number): void {
    const position: number = this.getHandlePositionFromMatrix(pointerPosition);
    const maxPixels: number = this.getSliderWidth();

    // handle cannot slide off the track
    if (position > 0 && position < maxPixels) {
      this.setHandlePosition(position);
      this.emitHandlePercent(position);
    }
  }

  // Returns a boolean (true) when mouse target is over the current named slider
  private pointerTargetIsSlider(event: MouseEvent | TouchEvent): boolean {
    const target = event.target as SVGGraphicsElement;
    return (
      target.classList.contains('slider') &&
      target.classList.contains(this.name)
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
          Math.abs(b.x1 - percent * 100) < Math.abs(a.x1 - percent * 100)
            ? b
            : a
      );

      return closestTickSvg.x1 / 100;
    }
    return percent;
  }

  // Returns a number (pixels)
  private getSliderWidth(): number {
    return this.valueSliderRef?.nativeElement.width.baseVal.value || 1;
  }
}
