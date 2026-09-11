import { Logger } from "../services/logger";

const template: HTMLTemplateElement = document.createElement('template');
const componentName: string = "my-component";

template.innerHTML = /*html*/`
<style>
  :host {
    /** :host here is used to style the web-component itself - note that outside styling have higher priority */
    /** :host(:selector) can be used to apply conditional styling, e.g.: ':host(:hover)', ':host([disabled])', ':host(.blue)', ':host([size="small"])' etc */
    display: block;
  }

  /** :host-context(<selector>) can be used to apply styling based on the component's parents; it applies when some parent matches the selector, e.g.: ':host-context(.dark-theme)' */
  /** NOTE: Not currently supported in all browsers... */
</style>

<div>...</div>
`;

class Component extends HTMLElement {
  _shadow: ShadowRoot;
  _initialised: boolean = false;
  _l: Logger | undefined;

  constructor() {
    // Note that the DOM cannot be affected within the constructor and instead such manipulations must be deferred to the lifecycle methods.
    super();

    this._shadow = this.attachShadow({ mode: 'open' });
    // The mode can be set to 'open' if we need the document to be able to access the shadow-dom internals.
    // Access happens through ths `shadowroot` property in the host.
    this._shadow.appendChild(template.content.cloneNode(true));
  }

  // Attributes need to be observed to be tied to the lifecycle change callback.
  static get observedAttributes() { return ['label', 'data']; }

  // Attribute values are always strings, so we need to convert them in their getter/setters as appropriate.
  get data() { return JSON.parse(this.getAttribute('data') ?? "{}"); }
  get label() { return this.getAttribute('label'); }

  set data(value: string) { this.setAttribute('data', value); }
  set label(value: string | null) { this.setAttribute('label', value ?? ""); }

  // A web component implements the following lifecycle methods.
  attributeChangedCallback(name: string, oldVal: string, newVal: string) {
    this._l?.debug(`---> attributeChangedCallback(${name}, ${oldVal}, ${newVal})`, componentName);
    // Attribute value changes can be tied to any type of functionality through the lifecycle methods.
    if (oldVal == newVal) return;
    switch (name) {
      default:
        break;
    }
  }
  connectedCallback() {
    // Triggered when the component is added to the DOM. Note that this is not triggered when the element is created.
    // Can be triggered multiple times, especially if the component is moved around.
    if (!this._initialised) {
      // ... initial setup
      this._initialised = true;
    }

    this._l = Logger.getInstance();

    // Note that custom elements cannot access custom properties or custom methods of another custom element from `connectedCallback` if the second element appears later in the DOM.
    // This can be overcome by using `window.customElements.whenDefined('element-name').then(() => { ... })`.
  }
  disconnectedCallback() {
    // Triggered when the component is removed from the DOM.
    // Ideal place for cleanup code.
    // Note that when destroying a component, it is good to also release any listeners.
  }
  adoptedCallback() {
    // Triggered when the element is adopted through `document.adoptElement()` (like when using an <iframe/>).
    // Note that adoption does not trigger the constructor again.
  }
}

window.customElements.define(componentName, Component);