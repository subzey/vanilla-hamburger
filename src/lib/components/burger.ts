import { createTemplate, createRoot } from '../utils/dom.js';
import type { RenderOptions } from '../types';

const AREA = 48;

const tpl = createTemplate(`
<style>
  :host {
    display: block;
    position: relative;
    width: 48px;
    height: 48px;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;
  }

  :host([hidden]) {
    display: none !important;
  }

  [part] {
    background: var(--burger-color, currentColor);
    position: absolute;
  }
</style>
`);

const defaultProps: Record<string, unknown> = {
  size: 32,
  direction: 'left',
  distance: 'md',
  duration: 0.4,
  easing: 'cubic-bezier(0, 0, 0, 1)',
  pressed: false
};

export abstract class Burger extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['distance', 'duration', 'easing', 'pressed', 'size'];
  }

  protected abstract get lines(): number;

  protected abstract render(options: RenderOptions): void;

  private _distance!: string;

  private _easing!: string;

  private _duration!: number;

  private _pressed!: boolean;

  private _size!: number;

  private _updating!: boolean;

  private _updatePromise: Promise<void> = Promise.resolve();

  get easing(): string {
    return this._easing;
  }

  set easing(easing: string) {
    this._easing = easing;
    this.update();
  }

  get distance(): string {
    return this._distance;
  }

  set distance(distance: string) {
    this._distance = distance;
    this.update();
  }

  get duration(): number {
    return this._duration;
  }

  set duration(duration: number) {
    this._duration = duration;
    this.update();
  }

  get pressed(): boolean {
    return this._pressed;
  }

  set pressed(pressed: boolean) {
    this._pressed = pressed;
    this.setAttribute('aria-pressed', `${!!pressed}`);
    this.update();
  }

  get size(): number {
    return this._size;
  }

  set size(size: number) {
    this._size = size;
    this.update();
  }

  constructor() {
    super();
    createRoot(this, tpl);
    this.addEventListener('click', this);
    this.addEventListener('keydown', this);
  }

  connectedCallback(): void {
    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', '0');

    (this.constructor as typeof Burger).observedAttributes.forEach((k) => {
      // A user may set a property on an _instance_ of an element,
      // before its prototype has been connected to this class.
      // If so, we need to run it through the proper class setter.
      if (this.hasOwnProperty(k)) {
        const value = this[k as keyof this];
        delete this[k as keyof this];
        this[k as keyof this] = value;
      } else if (!this[k as keyof this]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this[k as keyof this] = defaultProps[k] as any;
      }
    });
  }

  attributeChangedCallback(prop: string, oldVal: string, newVal: string): void {
    if (oldVal !== newVal) {
      let value: unknown = newVal;
      if (prop === 'size' || prop === 'distance') {
        value = newVal === null ? null : Number(newVal);
      } else if (prop === 'pressed') {
        value = newVal !== null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this[prop as keyof this] = value as any;
    }
  }

  handleEvent(event: KeyboardEvent | MouseEvent): void {
    if ((event.type === 'keydown' && (event as KeyboardEvent).key === 'Enter') || event.type === 'click') {
      this.pressed = !this.pressed;
      this.dispatchEvent(new CustomEvent('pressed-changed', { detail: { value: this.pressed } }));
    }
  }

  protected getRenderOptions(): RenderOptions {
    const { distance, lines } = this;

    const width = Math.max(12, Math.min(AREA, this.size));
    const room = Math.round((AREA - width) / 2);

    const barHeightRaw = width / 12;
    const barHeight = Math.round(barHeightRaw);

    const space = distance === 'lg' ? 0.25 : distance === 'sm' ? 0.75 : 0.5;
    const marginRaw = width / (lines * (space + (lines === 3 ? 1 : 1.25)));
    const margin = Math.round(marginRaw);

    const height = barHeight * lines + margin * (lines - 1);
    const topOffset = Math.round((AREA - height) / 2);

    const translate =
      lines === 3
        ? distance === 'lg'
          ? 4.0425
          : distance === 'sm'
          ? 5.1625
          : 4.6325
        : distance === 'lg'
        ? 6.7875
        : distance === 'sm'
        ? 8.4875
        : 7.6675;

    const deviation = (barHeightRaw - barHeight + (marginRaw - margin)) / (lines === 3 ? 1 : 2);
    const move = parseFloat((width / translate - deviation / (4 / 3)).toFixed(2));

    const barStyles = {
      height: `${barHeight}px`,
      left: `${room}px`,
      width: `${width}px`
    };

    return {
      barHeight,
      barStyles,
      margin,
      move,
      pressed: this.pressed,
      time: Math.max(0, this.duration),
      topOffset
    };
  }

  protected update(): void {
    if (!this._updating) {
      this._updatePromise = this._enqueueUpdate();
    }
  }

  private async _enqueueUpdate(): Promise<void> {
    this._updating = true;

    // Ensure that property changes are batched.
    await this._updatePromise;

    this.render(this.getRenderOptions());

    this._updating = false;
  }
}
