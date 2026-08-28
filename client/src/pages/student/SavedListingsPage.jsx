import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { WalkingTimeBadge } from '../../components/map/WalkingTimeBadge';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { formatPrice } from '../../utils/formatPrice';
import { ROUTES } from '../../constants/routes';
import { DEFAULT_GATE, CAMPUS_GATES } from '../../constants/campusGates';

export function SavedListingsPage() {
  const { accessToken } = useAuth();
  const [gate, setGate] = useState(DEFAULT_GATE);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentService.getFavorites(accessToken, gate);
      setItems(res.data || []);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, gate]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSelect(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  async function removeFavorite(propertyId) {
    await studentService.toggleFavorite(propertyId, accessToken);
    load();
  }

  const compareList = items.filter((p) => selected.includes(p.id));

  return (
    <PageContainer title="Saved Listings" subtitle="Bookmark dorms and compare side by side">
      <Link to={ROUTES.STUDENT_SEARCH} className="text-sm text-ateneo-blue hover:underline">
        ← Back to search
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-600">Compare walk time from</label>
        <select
          value={gate}
          onChange={(e) => setGate(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
        >
          {Object.entries(CAMPUS_GATES).map(([id, g]) => (
            <option key={id} value={id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader message="Loading saved listings…" />
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-600">
          No saved listings yet. Use Save on a property page to bookmark it here.
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-gray-500">Select up to 3 listings to compare.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <li
                key={p.id}
                className={`rounded-xl border bg-white p-4 shadow-sm ${
                  selected.includes(p.id) ? 'border-ateneo-blue ring-1 ring-ateneo-blue' : 'border-gray-200'
                }`}
              >
                {p.primary_image && (
                  <img src={p.primary_image} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/student/property/${p.id}?gate=${gate}`}
                      className="font-semibold text-ateneo-blue hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-gray-500">{p.address}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="mt-1"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {p.min_price != null && <span>{formatPrice(p.min_price)}/mo+</span>}
                  <WalkingTimeBadge minutes={p.walking_minutes} />
                  <span className="text-gray-500">{p.available_rooms} room(s) open</span>
                </div>
                <Button variant="ghost" className="mt-2 text-xs" onClick={() => removeFavorite(p.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>

          {compareList.length >= 2 && (
            <section className="mt-8 overflow-x-auto rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="font-semibold">Compare ({compareList.length})</h2>
              <table className="mt-3 w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Property</th>
                    <th className="py-2 pr-4">Price from</th>
                    <th className="py-2 pr-4">Walk time</th>
                    <th className="py-2">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {compareList.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium">{p.name}</td>
                      <td className="py-2 pr-4">{p.min_price != null ? formatPrice(p.min_price) : '—'}</td>
                      <td className="py-2 pr-4">{p.walking_minutes != null ? `${p.walking_minutes} min` : '—'}</td>
                      <td className="py-2">{p.available_rooms} vacant</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </PageContainer>
  );
}
