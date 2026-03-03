/**
 * useApiLoader — wraps any async operation with global loading state.
 * Also provides a local `loading` flag for inline skeleton/spinner UI.
 *
 * Usage:
 *   const { loading, run } = useApiLoader();
 *   useEffect(() => { run(() => fetchData()); }, []);
 */
import { useState, useCallback } from "react";
import { useLoading } from "../context/LoadingContext";

export function useApiLoader() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const { startLoading, stopLoading } = useLoading();

  const run = useCallback(async (asyncFn) => {
    setLoading(true);
    setError(null);
    startLoading();
    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return { loading, error, run };
}
