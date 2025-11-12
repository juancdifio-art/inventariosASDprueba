import { useCallback, useState } from 'react';
import api from '../api/api';

export function useGlobalSearch() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (term, type) => {
    if (!term) {
      setResults([]);
      return [];
    }

    setIsLoading(true);
    try {
      const { data } = await api.get('/search', {
        params: {
          q: term,
          type: type || undefined,
        },
      });
      const items = data?.data?.items ?? [];
      setResults(items);
      return items;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    results,
    isLoading,
    setResults,
    search,
  };
}
