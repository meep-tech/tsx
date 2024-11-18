import { debug } from '@meep-tech/debug';
import { Blank } from '@meep-tech/types';
import { JSX } from './jsx';

/**
 * A simple app class.
 */
export class App<
  TBody extends JSX.Component.Any | undefined = any,
  TConfig extends App.Config<any> = App.Config.Empty,
  THandledProps extends (
    (TBody extends JSX.Component.Any
      ? JSX.Props.Keys<TBody>
      : never
    )) = (TBody extends JSX.Component.Any
      ? App.HandledProps.Keys.None
      : never)
> {
  protected static get DEFAULT_INIT_TIMEOUT() {
    return 10000 as const;
  }

  //#region Private Fields
  #root?: HTMLElement;
  #config!: TConfig;
  #body!: TBody;
  #initProps!: App.InitProps<App<TBody, TConfig, THandledProps>>;

  //#endregion

  //#region Initialization
  protected get settings(): App.Settings {
    return {
      init: {
        timeout: App.DEFAULT_INIT_TIMEOUT
      }
    };
  }

  protected constructor(
    ...args: TBody extends JSX.Component.Any
      ? (THandledProps extends App.HandledProps.Keys.None
        ? [body: TBody]
        : [body: TBody, initProps: App.InitProps<App<TBody, TConfig, THandledProps>>])
      : []
  ) {
    if (args.length === 2) {
      this.#initProps = args.pop() as App.InitProps<App<TBody, TConfig, THandledProps>>;
      this.#body = args.pop() as TBody;
    } else if (args.length === 1) {
      this.#body = args.pop() as TBody;
    }
  }

  protected async init(
    this: Omit<this, 'config' | 'root'>,
    config: TConfig
  ) {
    const app = this as this;
    app.#config = Object.freeze(config);
  }
  //#endregion

  get config(): Readonly<TConfig> {
    return this.#config;
  }

  get root(): HTMLElement {
    return this.#root!;
  }

  @debug!()
  static async Init<
    TThis extends typeof App<any, TConfig, any>,
    TConfig extends App.Config<any> = App.Config.Empty
  >(
    this: TThis,
    ...args: TConfig extends App.Config.Empty
      ? [] | [error: 'No config provided']
      : [config: TConfig]
  ) {
    const [config] = args as [TConfig];
    const app = new (this as any)(config) as Omit<
      TThis['prototype'],
      'root'
    >;

    await (app as App.Any).init(config);
    return app;
  }

  @debug!()
  Attach<
    TThis extends App.Any | Omit<App.Any, 'root'>,
    TApp extends (TThis extends App.Any
      ? TThis
      : (TThis extends Omit<infer T, 'root'>
        ? T
        : never))
  >(
    this: TThis,
    root: HTMLElement
  ) {
    const app = this as App.Any;
    app.#root = root;

    return app as TApp;
  }

  Render<
    TProps extends (TBody extends JSX.Component<infer TProps, any, any>
      ? (TProps extends JSX.Props.None | JSX.Props.Empty
        ? TProps
        : never)
      : never)
  >(): this;

  Render<
    TProps extends (TBody extends JSX.Component<infer TProps, any, any>
      ? (TProps extends JSX.Props.Some
        ? TProps
        : never)
      : never)
  >(props: TProps): this;

  Render<
    TComponent extends (TBody extends undefined
      ? JSX.Component<JSX.Props.Empty | JSX.Props.None, any, any>
      : never)
  >(component: TComponent): this;

  Render<
    TComponent extends (TBody extends undefined
      ? JSX.Component<JSX.Props.Some, any, any>
      : never)
  >(
    component: TComponent,
    props: JSX.Props.Of<TComponent>
  ): this;

  @debug!()
  Render(...args: unknown[]) {
    try {
      // get the component to render
      const component
        = this.#body
        ?? args.pop() as JSX.Component.Any;

      // try to create the component
      const rendered: JSX.Element
        = component.isFunction()
          ? JSX.Create(component, {
            ...this.#initProps?.(this) ?? {},
            ...args.pop() as Record<PropertyKey, unknown>
          }) : component;

      // attach the component to the dom
      JSX.Attach(this.root, rendered);
    } // handle errors with a simple error view
    catch (e) {
      const err: { message: string } = e instanceof Error
        ? e
        : new Error(`${e ?? 'An unknown error occurred.'}`);
      console.error(err);

      this.root.innerHTML = `
        <h1>Error</h1>
        <p style="color: red;">${err.message}</p>
        ${err instanceof Error
          ? `<pre>${err.stack}</pre>`
          : ''
        }`;

      throw e;
    }

    return this;
  }
}

export namespace App {
  export type Any
    = App<any, any, any>;

  export type Unattached<TApp extends App.Any>
    = Omit<TApp, 'root'>;

  export type Settings = {
    init: {
      timeout: number;
    }
  }

  export type Body<TBody extends JSX.Component.Any | undefined = JSX.Component.Any>
    = TBody;

  export namespace Body {
    export type Unknown
      = undefined;

    export type Of<
      TApp extends App.Any
    > = TApp extends App<infer TBody, any, any>
      ? TBody
      : never;
  }

  export type Config<TConfig extends Record<string, any> | Config.Empty>
    = TConfig;

  export namespace Config {
    export type Empty
      = Blank;

    export type Of<
      TApp extends App.Any
    > = TApp extends App<any, infer TConfig, any>
      ? TConfig
      : Config.Empty;
  }

  export type InitProps<TApp extends App.Any>
    = (Body.Of<TApp> extends JSX.Component.Any
      ? ($: TApp) => HandledProps<TApp>
      : never);

  export type HandledProps<TApp extends App.Any>
    = (Body.Of<TApp> extends JSX.Component.Any
      ? (HandledProps.Keys.Of<TApp> extends App.HandledProps.Keys.None
        ? Partial<JSX.Props.Of<Body.Of<TApp>>>
        : (Partial<JSX.Props.Of<Body.Of<TApp>>>
          & Required<{ [key in HandledProps.Keys.Of<TApp>]: JSX.Props.Of<Body.Of<TApp>>[key] }>))
      : {});

  export namespace HandledProps {
    export type Keys<TApp extends App.Any = App.Any>
      = (Body.Of<TApp> extends JSX.Component.Any
        ? keyof JSX.Props.Of<Body.Of<TApp>>
        : Keys.None);

    export namespace Keys {
      export type Of<
        TApp extends App.Any
      > = TApp extends App<any, any, infer THandledProps>
        ? THandledProps
        : Keys.None;

      export type None
        = '';
    }
  }
}

export default App;