import { ConnectionObserver } from '@wessberg/connection-observer';
import type HTML from './html';
import { debug } from '@meep-tech/debug';
import css, { cls, CSS } from './css';
import { Blank, Blankable } from '@meep-tech/types';

export abstract class JSX {
  private constructor() { }

  /**
   * Attaches a JSX element to a root element.
   */
  @debug!()
  static Attach(
    root: HTMLElement,
    element: JSX.Element
  ) {
    const node = JSX.Node.Create(element);
    root.replaceChildren(node);

    return node;
  }

  /**
   * Appends a JSX element to the end of a root element.
   */
  @debug!()
  static Append(
    root: HTMLElement,
    element: JSX.Element
  ) {
    const node = JSX.Node.Create(element);
    root.appendChild(node);

    return node;
  }

  /**
   * Entry point for creating JSX elements.
   */
  @debug!()
  static Create<
    TElement extends JSX.Element.Type
  >(
    type: TElement,
    props: JSX.Props.Of<TElement> = {} as JSX.Props.Of<TElement>,
    ...children: JSX.Children.Of<TElement>
  ): JSX.Element.Of<TElement> {
    if (type.isString()) {
      return JSX.Element.Create<any>(
        type,
        props,
        ...children
      ) as JSX.Element.Of<TElement>;
    } else {
      return JSX.Component.Create<any>(
        type,
        props,
        ...children
      ) as JSX.Element.Of<JSX.Component.Any>;
    }
  }

  @debug!()
  static CreateElement<TElement extends keyof JSX.Elements.Intrinsic>(
    tag: TElement,
    props: JSX.Props.Of<TElement> = {} as JSX.Props.Of<TElement>,
    ...children: JSX.Children.Of<TElement>
  ): HTMLElement {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      switch (key) {
        case 'class': {
          el.className = cls(value as CSS.Classes);
          break;
        }
        case 'style': {
          el.style.cssText = css(value as CSS.Styles);
          break;
        }
        case 'key': {
          const k = value.toString();
          if ('key' in el) {
            el.key = k;
          }
          if ('name' in el && !el.name?.toString()) {
            el.name = k;
          }
          if ('id' in el && !el.id?.toString()) {
            el.id = k;
          }

          break;
        }
        case 'for': {
          if ('htmlFor' in el) {
            el.htmlFor = value.toString();
          }
          break;
        }
        default: {
          const attr = key.toLowerCase();
          if ((el.hasOwnProperty(attr) && el.ownPropertyIsWriteable(attr)) || attr in el) {
            (el as Record<typeof attr, typeof value>)[attr] = value;
          } else {
            console.warn(`Property at 'key' is not writable on element with the desired 'tag'.`, { tag, key });
          }
        }
      }
    }

    for (const child of children) {
      if (child === null || child === undefined) {
        continue;
      }

      const node = JSX.Node.Create(child);

      el.appendChild(node);
    }

    return el;
  }

  @debug!()
  static CreateComponent<
    TComponent extends JSX.Component.Any
  >(
    ctor: TComponent,
    props: JSX.Props.Of<TComponent>,
    ...children: JSX.Children.Of<TComponent>
  ): Node {
    let el: JSX.Element = ctor(props, ...(children as JSX.Element[]));
    if (ctor.OnCreate) {
      el = ctor.OnCreate(el) ?? el;
    }

    el = JSX.Node.Create(el);
    if (ctor.OnAttach) {
      const observer
        = new ConnectionObserver(([e]) => {
          ctor.OnAttach!(e.target)
          observer.disconnect();
        });

      observer.observe(el);
    }

    return el;
  }


  @debug!()
  static CreateFragment(
    ...children: JSX.Element[]
  ): DocumentFragment {
    const fragment = document.createDocumentFragment();
    for (const child of children ?? []) {
      const node = JSX.Node.Create(child);
      fragment.appendChild(node);
    }

    return fragment
  }

  @debug!()
  static CreateNode(
    element: JSX.Element
  ): Node {
    if (element === null || element === undefined) {
      return JSX.Empty.Create();
    } else if (element.isString() || element.isNumber() || element.isBoolean()) {
      return document.createTextNode(element.toString());
    } else if (element instanceof Node) {
      return element;
    } else if (element.isIterable()) {
      return JSX.Fragment.Create(...element);
    } else {
      console.warn(`Element is not a valid or known JSX element.`, { element });
      return element;
    }
  }

  @debug!()
  static CreateEmpty(): Node {
    return document.createDocumentFragment();
  }

  @debug!()
  static ToElement(
    element: JSX.Element
  ): HTMLElement {
    const node = JSX.Node.Create(element);
    if (node instanceof HTMLElement) {
      return node;
    } else if (node instanceof DocumentFragment) {
      const el = document.createElement('div');
      el.replaceChildren(...node.children);

      return el;
    } else if (node instanceof Text) {
      const p = document.createElement('p');
      p.innerText = node.textContent ?? '';

      return p;
    } else if (node ?? true) {
      return document.createElement('div');
    } else {
      throw new Error(`Element is not a valid or known JSX element: ${node}`);
    }
  }

  @debug!()
  static ToHTML(
    element: JSX.Element
  ): string {
    return JSX.ToElement(element).outerHTML;
  }
}

/**
 * Contains constants and utilities related to creating and using JSX elements.
 */
export namespace JSX {

  /**
   * Represents an empty JSX element.
   */
  export type Empty
    = null;

  export namespace Empty {
    export const Create
      = JSX.CreateEmpty;
  }

  /**
   * Represents a JSX fragment.
   */
  export type Fragment
    = Iterable<Node>;

  export namespace Fragment {
    export const Create
      = JSX.CreateFragment;
  }

  /**
   * A valid JSX element.
   */
  export type Element
    = Node
    | Empty
    | Fragment
    | string
    | number
    | boolean;

  export namespace Element {
    export const Fragment = JSX.Fragment;
    export type Fragment = JSX.Fragment;

    export type Intrinsics = IntrinsicElements;

    /**
     * Get the element type produced by a JSX component.
     */
    export type Of<TType extends Element.Type>
      = (TType extends ((...args: any[]) => infer E)
        ? E
        : (TType extends string
          ? HTMLElement
          : never));

    /**
     * The type of a JSX element/HTML component tag.
     */
    export type Type
      = keyof Elements.Intrinsic
      | Component.Any;

    /**
     * Parses a JSX element into a DOM element.
     * * If a prop starts with "$" and the element has a property with the same name, the prop is set to the element's props as well.
     */
    export const Create
      = JSX.CreateElement;
  }

  /**
   * A builder for a type of JSX element.
   */
  export type Component<
    TProps extends Props.Any = Props,
    TChildren extends Children.Any = Children.Any,
    TElement extends Element = Element
  > = {
    (props: TProps, ...children: TChildren): TElement;
    OnCreate?: (el: TElement) => TElement | void;
    OnAttach?: (e: Node) => void | Promise<void>;
  };

  export namespace Component {
    export const Create
      = JSX.CreateComponent;

    export type Any
      = Component<any, any, any>;

    export type None
      = undefined;
  }

  export namespace Node {
    export const Create
      = JSX.CreateNode;
  }

  // /**
  //  * The type of a child of a JSX element.
  //  */
  // export type Child<TElement extends JSX.Element = JSX.Element>
  //   = TElement;

  export namespace Child {
    export type Of<TElement extends Element.Type>
      = (TElement extends Component<any, infer C, any>
        ? C[number]
        : (TElement extends keyof Elements.Intrinsic
          ? (Elements.Intrinsic[TElement] extends { children: (infer C)[] }
            ? C
            : [])
          : never));
  }

  export type Props<
    TValue = unknown,
    TKeys extends PropertyKey | undefined = PropertyKey
  > = (TKeys extends undefined
    ? Record<PropertyKey, TValue>
    : (TKeys extends PropertyKey
      ? Record<TKeys, TValue>
      : TValue));

  export namespace Props {
    export type Some
      = Exclude<Props.Any, None | Empty>;

    export type Any
      = Props<any, any>;

    export type None
      = undefined;

    export type Empty
      = Blank;

    /**
     * Gets the props of a JSX component type.
     */
    export type Of<T extends Element.Type>
      = (T extends Component<infer TProps, any, any>
        ? (TProps extends Record<PropertyKey, any>
          ? (TProps extends Blankable<TProps>
            ? (TProps | undefined)
            : TProps)
          : TProps)
        : (T extends keyof Elements.Intrinsic
          ? Elements.Intrinsic[T]
          : never));

    /**
     * Gets the keys of the props of a JSX component type.
     */
    export type Keys<T extends Element.Type>
      = keyof Extract<Props.Of<T>, Record<PropertyKey, any>>;
  }

  export namespace Children {
    export type Of<TElement extends Element.Type>
      = (TElement extends keyof JSX.Elements.Intrinsic
        ? (JSX.Elements.Intrinsic[TElement] extends { children: infer C }
          ? C[]
          : [])
        : JSX.Child.Of<TElement>);

    export type Any
      = JSX.Element[];

    export type None
      = [];
  }

  export namespace Elements {
    export const Element = JSX.Element;
    export type Element = JSX.Element;

    export const Fragment = JSX.Fragment;
    export type Fragment = JSX.Fragment;

    export interface Intrinsic
      extends HTML.Elements { }
  }
  export interface IntrinsicElements
    extends Elements.Intrinsic { }
}

export default JSX;
export { JSX as TSX };