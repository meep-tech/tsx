import type { JSX } from './jsx.ts';
import { CSS } from './css';

export namespace HTML {
  export type Elements
    = Elements.Default;

  export namespace Elements {
    export type Default = {
      readonly ['']: Element;
      readonly script: Element<{
        type?: 'module' | 'text/javascript' | 'babel';
        src?: string;
        async?: boolean;
      }>;
      readonly div: Element;
      readonly span: Element;
      readonly hr: Element<Element.Props.Default, Element.Children.None>;
      readonly p: Element;
      readonly ul: Element;
      readonly ol: Element;
      readonly dl: Element;
      readonly li: Element;
      readonly dt: Element;
      readonly dd: Element;
      readonly pre: Element;
      readonly details: Element;
      readonly summary: Element;
    } & {
      readonly h1: Element;
      readonly h2: Element;
      readonly h3: Element;
      readonly h4: Element;
      readonly h5: Element;
      readonly h6: Element;
    } & {
      readonly form: Element<{
        onSubmit?: (e: SubmitEvent) => void;
      }>;
      readonly label: Element<{ for: string }>;
      readonly input: Element<{
        disabled?: boolean;
        required?: boolean;
        onChange?: (e: InputEvent) => void;
      } & ({
        type: 'file'
        accept?: string;
        multiple?: boolean,
        webkitdirectory?: boolean,
        directory?: boolean,
      } | {
        type: 'text'
        placeholder?: string;
        value?: string;
      })>;
      readonly button: Element<{
        type?: 'submit' | 'reset' | 'button';
      }>;
    };
  }

  export type Element<
    TProps extends Element.Props.Any = Element.Props.Default,
    TChildren extends Element.Children.Any = Element.Children.Any
  > = TProps
    & Element.Props.Default
    & (TChildren extends {}
      ? (TChildren extends undefined
        ? { children?: TChildren }
        : { children: TChildren })
      : { children?: never });

  export namespace Element {
    export type Props<TRest extends Props.Any>
      = Props.Default
      & TRest;

    export namespace Props {
      export type None
        = Record<string, never>;

      export type Any
        = Record<string, any>;

      export type Default
        = {
          id?: string;
          key?: string;
          class?: CSS.Classes;
          style?: CSS.Styles;
          onClick?: (e: MouseEvent) => void;
        };
    }

    export type Children<
      TElement extends JSX.Element
    > = undefined
      | TElement
      | TElement[];

    export namespace Children {
      export type None
        = undefined;

      export type Any
        = Children<any>;

      export type Alone<TElement extends JSX.Element = JSX.Element>
        = TElement
        | [TElement];

      export type Required<TElement extends JSX.Element = JSX.Element>
        = TElement
        | TElement[];
    }
  }
}

export default HTML;