declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'postcss-load-config' {
  interface Config {
    plugins: {
      [key: string]: Record<string, unknown> | boolean | undefined;
    };
  }
}