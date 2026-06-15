import React, { useEffect, useState } from 'react';
import { fetchBoxComics } from '../utilities/api';
import ComicDetailModal from './ComicDetailModal';

export default function BoxDetailScreen({ box, onBack, onViewSeries, onAddToPicklist }) {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComic, setSelectedComic] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchBoxComics(box.id)
      .then(data => { setComics(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [box.id]);

  const handleViewSeries = (title, publisher) => {
    setSelectedComic(null);
    onViewSeries(title, publisher);
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header with back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            background: '#edf2f7', border: 'none', borderRadius: '8px',
            padding: '8px 12px', fontSize: '14px', cursor: 'pointer',
            fontWeight: 'bold', color: '#4a5568',
          }}
        >
          ← Back
        </button>
        <div>
          <h3 style={{ margin: 0, color: '#2d3748', fontSize: '18px' }}>{box.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ background: '#edf2f7', color: '#4a5568', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
              📍 {box.location}
            </span>
            {!loading && (
              <span style={{ fontSize: '13px', color: '#718096' }}>
                {comics.length} {comics.length === 1 ? 'issue' : 'issues'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#718096', fontSize: '14px', fontStyle: 'italic' }}>
          Loading inventory...
        </div>
      )}

      {/* Empty state */}
      {!loading && comics.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0aec0', fontSize: '14px', fontStyle: 'italic' }}>
          This container is empty. Scan some comics into it!
        </div>
      )}

      {/* Comic list */}
      {!loading && comics.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {comics.map(comic => (
            <div
              key={comic.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px', background: '#fff',
                border: '1px solid #e2e8f0', borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
            >
              {/* Cover thumbnail */}
              <div style={{
                width: '36px', height: '52px', borderRadius: '4px', overflow: 'hidden',
                background: '#e2e8f0', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                {comic.cover_image ? (
                  <img src={comic.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '16px' }}>📘</span>
                )}
              </div>

              {/* Title / Issue / Publisher */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {comic.title} #{comic.issue_number}
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>
                  {comic.publisher}
                </div>
              </div>

              {/* Value */}
              <div style={{ fontWeight: 'bold', color: '#2f855a', fontSize: '14px', textAlign: 'right', flexShrink: 0, marginRight: '8px' }}>
                ${comic.estimated_value.toFixed(2)}
              </div>

              {/* Action buttons */}
              <button
                onClick={() => onAddToPicklist({ title: comic.title, issue_number: comic.issue_number, publisher: comic.publisher })}
                style={{
                  background: '#faf5ff', border: 'none', borderRadius: '6px',
                  padding: '6px 8px', fontSize: '12px', cursor: 'pointer',
                  fontWeight: 'bold', color: '#805ad5', whiteSpace: 'nowrap',
                }}
              >
                📋
              </button>
              <button
                onClick={() => setSelectedComic(comic)}
                style={{
                  background: '#edf2f7', border: 'none', borderRadius: '6px',
                  padding: '6px 10px', fontSize: '12px', cursor: 'pointer',
                  fontWeight: 'bold', color: '#4a5568', whiteSpace: 'nowrap',
                }}
              >
                👁 View
              </button>
              <button
                onClick={() => handleViewSeries(comic.title, comic.publisher)}
                style={{
                  background: '#ebf8ff', border: 'none', borderRadius: '6px',
                  padding: '6px 10px', fontSize: '12px', cursor: 'pointer',
                  fontWeight: 'bold', color: '#3182ce', whiteSpace: 'nowrap',
                }}
              >
                📚 Series
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Comic detail modal */}
      {selectedComic && (
        <ComicDetailModal
          comic={selectedComic}
          onClose={() => setSelectedComic(null)}
          onViewSeries={handleViewSeries}
          onAddToPicklist={onAddToPicklist}
        />
      )}
    </div>
  );
}
