import { Logger } from "../../services/logger";
import { Translations, Translator } from "../../services/translator";
import resetStyles from '../../styles/reset.css?inline';
import componentStyles from './styles.css?inline';
import templateHtml from './doc.html?raw';

const template: HTMLTemplateElement = document.createElement('template');
const componentName: string = "my-component";

template.innerHTML = /*html*/`
<style>
  ${resetStyles}
  ${componentStyles}
</style>

${templateHtml}
`;

class Component extends HTMLElement {
  _shadow: ShadowRoot;
  _initialised: boolean = false;
  _l: Logger | undefined;
  _t: Translator | undefined;

  _textElements: Record<string, HTMLElement> = {};
  _translations: Record<string, Translations> = {};

  constructor() {
    // Note that the DOM cannot be affected within the constructor and instead such manipulations must be deferred to the lifecycle methods.
    super();

    this._shadow = this.attachShadow({ mode: 'open' });
    // The mode can be set to 'open' if we need the document to be able to access the shadow-dom internals.
    // Access happens through ths `shadowroot` property in the host.

    template.shadowRootDelegatesFocus = true; // focused can be delegated within the component from the outside
    this._shadow.appendChild(template.content.cloneNode(true));

    this._l = Logger.getInstance();
    this._t = Translator.getInstance();
  }

  // Attributes need to be observed to be tied to the lifecycle change callback.
  static get observedAttributes() { return ['label', 'data', 'i18n']; }

  // Attribute values are always strings, so we need to convert them in their getter/setters as appropriate.
  get data() { return JSON.parse(this.getAttribute('data') ?? "{}"); }
  get label() { return this.getAttribute('label'); }
  get i18n() { return this.getAttribute('i18n'); }

  set data(value: string) { this.setAttribute('data', value); }
  set label(value: string | null) { this.setAttribute('label', value ?? ""); }
  set i18n(value: string | null) { this.setAttribute('i18n', value ?? 'en'); }

  // A web component implements the following lifecycle methods.
  attributeChangedCallback(name: string, oldVal: string, newVal: string) {
    this._l?.debug(`---> attributeChangedCallback(${name}, ${oldVal}, ${newVal})`, componentName);
    // Attribute value changes can be tied to any type of functionality through the lifecycle methods.
    if (oldVal == newVal) return;
    switch (name) {
      case 'i18n':
        this._t?.registerElementsForTranslations(newVal, this._textElements, this._translations);
        break;
      default:
        break;
    }
  }
  connectedCallback() {
    // Triggered when the component is added to the DOM. Note that this is not triggered when the element is created.
    // Can be triggered multiple times, especially if the component is moved around.
    if (this._initialised) return;

    Object.keys(this._translations).forEach((t: string) => {
      const el: HTMLElement | null = this._shadow.getElementById(t);
      if (!el) return;

      this._textElements[t] = el;
    });

    // Note that custom elements cannot access custom properties or custom methods of another custom element from `connectedCallback` if the second element appears later in the DOM.
    // This can be overcome by using `window.customElements.whenDefined('element-name').then(() => { ... })`.

    this._initialised = true;
  }
  disconnectedCallback() {
    // Triggered when the component is removed from the DOM.
    // Ideal place for cleanup code.
    // Note that when destroying a component, it is good to also release any listeners.

    if (this.i18n && this._t) this._t.unregisterElementsForTranslations(this.i18n, this._textElements);
  }
  adoptedCallback() {
    // Triggered when the element is adopted through `document.adoptElement()` (like when using an <iframe/>).
    // Note that adoption does not trigger the constructor again.
  }
}

window.customElements.define(componentName, Component);