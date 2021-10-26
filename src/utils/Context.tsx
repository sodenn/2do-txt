import React from 'react';

export function createContext<T, C>(
  contextFactory: (initialData?: C) => T
): [(props: { children?: React.ReactNode; initialData?: C }) => JSX.Element, () => T] {
  const Ctx = React.createContext<T>(null as unknown as T);

  const CtxProvider = (props: { children?: React.ReactNode; initialData?: C }) => {
    const { children, initialData } = props;
    const ctx = contextFactory(initialData);
    return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
  };

  const useCtx = () => {
    const ctx = React.useContext(Ctx);
    if (!ctx) {
      throw new Error(
        `createContext: This component should be wrapped by a ContextProvider provided by: createContext(${contextFactory.name})`
      );
    }
    return ctx;
  };

  return [CtxProvider, useCtx];
}
