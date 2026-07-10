import { useState, useEffect } from 'react';

/**
 * Subscribe to a CSS media query and re-render when it changes.
 * @param {string} query e.g. '(max-width: 1024px)'
 * @returns {boolean} whether the query currently matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

// Shared breakpoints — keep in sync with the media queries in index.css
export const useIsMobile = () => useMediaQuery('(max-width: 640px)');
export const useIsCompact = () => useMediaQuery('(max-width: 1024px)'); // phone + portrait tablet → drawer nav
