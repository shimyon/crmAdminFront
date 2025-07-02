import React, { createContext, useContext, useState, useCallback } from 'react';

const LoaderContext = createContext({ showLoader: () => {}, hideLoader: () => {}, loading: false });

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const showLoader = useCallback(() => setLoading(true), []);
  const hideLoader = useCallback(() => setLoading(false), []);
  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext); 