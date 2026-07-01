import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useOpenOrderFromUrl(requests, selectedOrder, setSelectedOrder) {
  const [searchParams, setSearchParams] = useSearchParams();
  const closingRef = useRef(false);

  const highlightNoteId = searchParams.get('note') || null;

  useEffect(() => {
    const openId = searchParams.get('open');
    const moduleId = searchParams.get('module');
    if (!openId) {
      closingRef.current = false;
      return;
    }
    if (closingRef.current || !requests.length) return;

    const found = requests.find(
      (r) => r.id === openId && (!moduleId || r.moduleId === moduleId || r.category === moduleId),
    );
    if (found && (!selectedOrder || selectedOrder.id !== found.id)) {
      setSelectedOrder(found);
    }
  }, [searchParams, requests, selectedOrder, setSelectedOrder]);

  const closeOrder = () => {
    closingRef.current = true;
    setSelectedOrder(null);
    const next = new URLSearchParams(searchParams);
    next.delete('open');
    next.delete('module');
    next.delete('note');
    setSearchParams(next, { replace: true });
  };

  return { closeOrder, highlightNoteId };
}
