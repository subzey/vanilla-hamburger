import { DirectionBurger } from '../components/direction-burger.js';
import { bar, createTemplate, createRoot, getStyles, setStyles } from '../utils/dom.js';
import type { RenderOptions } from '../types';

const tpl = createTemplate(`<button part="button" type="button"></button>${bar}${bar}${bar}`);

export class Sling extends DirectionBurger {
  private _styles!: CSSStyleDeclaration[];

  constructor() {
    super();
    this._styles = getStyles(createRoot(this, tpl));
  }

  protected get lines(): number {
    return 3;
  }

  protected render(options: RenderOptions): void {
    const { barHeight, barStyles, margin, move, pressed, time, topOffset } = options;

    const isLeft = this.direction === 'left';
    const transition = `${time}s ${this.easing}`;

    setStyles(this.style, {
      transition,
      transform: `${pressed ? `rotateY(${180 * (isLeft ? -1 : 1)}deg)` : 'none'}`
    });

    setStyles(this._styles[0], {
      ...barStyles,
      top: `${topOffset}px`,
      transition,
      transform: `${
        pressed ? `rotate(${45 * (isLeft ? -1 : 1)}deg) translate(${move * (isLeft ? -1 : 1)}px, ${move}px)` : 'none'
      }`
    });

    setStyles(this._styles[1], {
      ...barStyles,
      top: `${topOffset + barHeight + margin}px`,
      transition,
      transform: `${pressed ? `scale(0, 1) translate(${move * 20 * (isLeft ? -1 : 1)}px, 0)` : 'none'}`
    });

    setStyles(this._styles[2], {
      ...barStyles,
      top: `${topOffset + barHeight * 2 + margin * 2}px`,
      transition,
      transform: `${
        pressed
          ? `rotate(${45 * (isLeft ? 1 : -1)}deg) translate(${move * (isLeft ? -1 : 1)}px, ${move * -1}px)`
          : 'none'
      }`
    });
  }
}
