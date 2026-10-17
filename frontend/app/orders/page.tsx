'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  product: string;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.orders.getAll();
      if (response.success) {
        const filteredOrders = response.data.filter((order: Order) => order.total > 0);
        setOrders(filteredOrders);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (orderId: number) => {
    router.push(`/offer/summary?id=${orderId}`);
  };

  const handleDelete = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Czy na pewno chcesz usunąć tę ofertę?')) {
      return;
    }

    try {
      setDeletingId(orderId);
      const response = await api.offers.delete(orderId);
      if (response.success) {
        setOrders(orders.filter((order) => order.id !== orderId));
      } else {
        alert('Błąd podczas usuwania oferty');
      }
    } catch (err) {
      console.error('Error deleting offer:', err);
      alert('Błąd podczas usuwania oferty');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowDoubleClick = (orderId: number) => {
    router.push(`/offer/summary?id=${orderId}`);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') return 'volt-badge volt-badge--ok';
    if (s === 'pending') return 'volt-badge volt-badge--warn';
    return 'volt-badge';
  };

  if (loading) {
    return (
      <AppShell backHref="/app" title="Lista Ofert">
        <p className="volt-muted" style={{ fontSize: 18 }}>
          Ładowanie ofert…
        </p>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell backHref="/app" title="Lista Ofert">
        <p style={{ color: 'var(--volt-danger)', marginBottom: 16 }}>Błąd: {error}</p>
        <button type="button" onClick={fetchOrders} className="volt-btn">
          Ponów
        </button>
      </AppShell>
    );
  }

  return (
    <AppShell
      backHref="/app"
      title="Lista Ofert"
      actions={
        <button type="button" onClick={fetchOrders} className="volt-btn volt-btn--sm">
          Odśwież
        </button>
      }
    >
      <div style={{ marginBottom: 22 }}>
        <p className="volt-eyebrow">Oferty</p>
        <h1
          style={{
            fontSize: 'clamp(26px, 3.5vw, 34px)',
            letterSpacing: '-0.03em',
            margin: '6px 0 0',
            fontWeight: 800,
          }}
        >
          Zapisane oferty
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="volt-card" style={{ textAlign: 'center', padding: 48 }}>
          <p className="volt-muted" style={{ fontSize: 17, margin: 0 }}>
            Brak ofert
          </p>
        </div>
      ) : (
        <div className="volt-table-wrap">
          <table className="volt-table">
            <thead>
              <tr>
                <th>Numer oferty</th>
                <th>Klient</th>
                <th>Produkt</th>
                <th>Liczba obwodów</th>
                <th>Wartość</th>
                <th>Status</th>
                <th>Data utworzenia</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} onDoubleClick={() => handleRowDoubleClick(order.id)}>
                  <td style={{ fontWeight: 700 }}>{order.orderNumber}</td>
                  <td className="volt-muted">{order.customerName}</td>
                  <td className="volt-muted">{order.product}</td>
                  <td className="volt-muted">{order.quantity}</td>
                  <td style={{ fontWeight: 700 }}>{order.total.toFixed(2)} PLN</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                  </td>
                  <td className="volt-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(order.id)}
                        className="volt-btn volt-btn--sm"
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(order.id, e)}
                        disabled={deletingId === order.id}
                        className="volt-btn volt-btn--danger volt-btn--sm"
                        style={{ opacity: deletingId === order.id ? 0.5 : 1 }}
                      >
                        {deletingId === order.id ? 'Usuwanie…' : 'Usuń'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
