export namespace CSS {
  export type Key
    = string;

  export type Ignore
    = false
    | undefined
    | null;

  export type Include
    = true;

  export type Settings
    = string
    | number
    | (number | string)[];

  export type Getter<
    T extends Ignore | Include | Settings = (
      Ignore | Include | Settings)
  > = () => T;

  export type Value
    = Ignore
    | Include
    | Settings
    | Getter;

  export type Style
    = `${Key}: ${string | number}${';' | ''}`;

  export type Map
    = Record<Style, Include | Ignore | Getter<Include | Ignore>>
    & Record<Key, Exclude<Value, Include>>

  export type Styles
    = Style
    | Style[]
    | Map;

  export type Class
    = string
    | undefined
    | (() => string | undefined);

  export type Classes
    = Class
    | Class[]
    | Record<string, boolean | (() => boolean)>;
}

export function cls(
  ...classes: CSS.Classes[]
): string {
  return classes.map(c => {
    if (c === undefined) {
      return '';
    } if (typeof c === 'string') {
      return c;
    } else if (Array.isArray(c)) {
      return cls(...c);
    } else {
      return Object.entries(c)
        .map(([key, value]) =>
          value && key)
        .filter(Boolean)
        .join(' ');
    }
  }).join(' ');
}

export function styles(
  ...styles: CSS.Styles[]
): string {
  return styles.map(style => {
    if (typeof style === 'string') {
      return style;
    } else if (Array.isArray(style)) {
      return style.map(s =>
        css(s))
        .join('');
    } else {
      return Object.entries(style)
        .map(([key, value]) =>
          css.style(key, value))
        .join('');
    }
  }).join('');
}

export function style(
  key: CSS.Key,
  value: CSS.Value
) {
  if (value === false || value === undefined || value === null) {
    return '';
  } else if (value === true) {
    return key;
  } if (typeof value === 'string' || typeof value === 'number') {
    return `${key}: ${value};`;
  } else if (Array.isArray(value)) {
    return `${key}: ${value.join(' ')}`;
  } else {
    return style(key, value());
  }
}

export const css
  = Object.assign(styles, {
    cls,
    style,
    styles,
    cx: cls,
    class: cls,
    classes: cls,
  });


export default css;