// src/screens/DashboardScreen.jsx
import React, { useState, useEffect } from 'react';
import ComicScanner from '../components/ComicScanner';
import SeriesVolumeViewer from '../components/SeriesVolumeViewer';
import { fetchBoxes, fetchValuation, createBox, searchComics } from '../utilities/api';

export default function DashboardScreen() {
  const [boxes, setBoxes] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [boxValuations, setBoxValuations] = useState({});
  
  // UI Control states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewBoxFormOpen, setIsNewBoxFormOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Right Drawer Side-Panel Context
  const [activeSeriesFocus, setActiveSeriesFocus] = useState(null);

  // New Box parameters
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxLocation, setNewBoxLocation] = useState('');

  // 1. Initial configuration load & close-modal refresher loop
  useEffect(() => {
    loadVaultData();
  }, [isScannerOpen]);

  const loadVaultData = () => {
    fetchBoxes()
      .then(async (data) => {
        setBoxes(data);
        if (data.length > 0 && !selectedBoxId) {
          setSelectedBoxId(data[0].id.toString());
        }
        
        // Harvest financial metrics for every single registered container node
        const valuationMap = {};
        for (const box of data) {
          try {
            const val = await fetchValuation(box.id);
            valuationMap[box.id] = val;
          } catch (e) {
            console.error(`Error pulling values for box ${box.id}`, e);
          }
        }
        setBoxValuations(valuationMap);
      })
      .catch(err => console.error("API link broken:", err));
  };

  // 2. Live global database index search handler (300ms Debounce)
  useEffect(() => {
    if (globalSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      searchComics(globalSearchQuery)
        .then(data => setSearchResults(data))
        .catch(err => console.error(err));
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [globalSearchQuery]);

  const handleCreateBoxSubmit = (e) => {
    e.preventDefault();
    createBox({ name: newBoxName, location: newBoxLocation })
      .then((newBox) => {
        setBoxes([...boxes, newBox]);
        setSelectedBoxId(newBox.id.toString());
        setNewBoxName('');
        setNewBoxLocation('');
        setIsNewBoxFormOpen(false);
        loadVaultData(); // Re-trigger overall store matrix values
      });
  };

  // Compute total store enterprise capital metrics
  const globalTotalBooks = Object.values(boxValuations).reduce((acc, curr) => acc + (curr?.total_comics || 0), 0);
  const globalMarketValue = Object.values(boxValuations).reduce((acc, curr) => acc + (curr?.financials?.total_estimated_retail_value || 0), 0);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '15px', paddingBottom: '80px' }}>
      
      {/* HEADER DECK */}
      <header style={{ paddingBottom: '15px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        <h1 style={{ margin: 0, color: '#e53e3e', fontSize: '26px' }}>⚡ ComicCache </h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#718096' }}> Store Collection </p>
      </header>

      {/* GLOBAL MASTER CATALOG SEARCH INPUT */}
      <section style={{ marginBottom: '25px' }}>
        <input 
          type="text"
          placeholder="🔍 Quick search catalog by title, creator, tag, or barcode..."
          value={globalSearchQuery}
          onChange={e => setGlobalSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px 15px', fontSize: '15px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
        />
      </section>

      {/* SEARCH INTERCEPT LOGIC */}
      {globalSearchQuery.trim().length >= 2 && (
        <section style={{ marginBottom: '30px', background: '#f7fafc', padding: '15px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#4a5568' }}>Query Results</h3>
            <button onClick={() => { setGlobalSearchQuery(''); setSearchResults([]); }} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', fontWeight: 'bold' }}>Clear</button>
          </div>

          {/* BUCKET 1: SERIES MATCHES (Deduplicated Core Series Groups) */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', tracking: 'wide' }}>📚 Matching Series Runs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Array.from(new Set(searchResults.map(c => `${c.title}|||${c.publisher}`))).map(seriesKey => {
                const [title, publisher] = seriesKey.split('|||');
                const totalInVault = searchResults.filter(c => c.title === title && c.publisher === publisher).length;

                return (
                  <div 
                    key={seriesKey} 
                    onClick={() => setActiveSeriesFocus({ title, publisher })}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-betweefn', 
                      alignItems: 'center', 
                      padding: '12px', 
                      background: '#ffffff',
                      border: '1px solid #e2e8f0', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                  >
                    <div>
                      <strong style={{ color: '#2d3748' }}>{title}</strong>
                      <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase' }}>{publisher}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#3182ce', fontWeight: 'bold' }}>
                      Open Run Timeline ({totalInVault} owned) ➔
                    </span>
                  </div>
                );
              })}
              {searchResults.length === 0 && <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic' }}>No matching series found.</div>}
            </div>
          </div>

          {/* BUCKET 2: EXACT INDIVIDUAL COPIES IN VAULT */}
          <div style={{ marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', tracking: 'wide' }}>🔍 Exact Copies In Vault</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {searchResults.map(comic => (
                <div key={comic.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#2d3748' }}>{comic.title} #{comic.issue_number}</span>
                    <div style={{ fontSize: '11px', color: '#718096' }}>Location: Box "{comic.box_name}" ({comic.box_location})</div>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#2f855a' }}>${comic.estimated_value.toFixed(2)}</span>
                </div>
              ))}
              {searchResults.length === 0 && <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic' }}>No specific matching variants located.</div>}
            </div>
          </div>

        </section>
      )}

      {/* VAULT FINANCIAL CAPITAL METRICS SUMMARY */}
      <section style={{ background: '#2d3748', color: '#fff', padding: '18px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h4 style={{ margin: '0 0 5px 0', textTransform: 'uppercase', tracking: 'wide', fontSize: '11px', color: '#a0aec0' }}>Total Cache Worth</h4>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#68d391' }}>${globalMarketValue.toFixed(2)}</div>
        <div style={{ fontSize: '13px', marginTop: '5px', color: '#cbd5e0' }}>Aggregated asset balance across <strong>{globalTotalBooks}</strong> inventoried items</div>
      </section>

      {/* CONTAINER CARDS LAYOUT MANAGER */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#4a5568' }}>📦 Storage Containers</h3>
          <button 
            onClick={() => setIsNewBoxFormOpen(!isNewBoxFormOpen)}
            style={{ background: '#edf2f7', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
          >
            {isNewBoxFormOpen ? "Cancel" : "+ New Container"}
          </button>
        </div>

        {/* INTERACTIVE MANIFEST FOR NEW COLD-STORAGE COMPARTMENT */}
        {isNewBoxFormOpen && (
          <form onSubmit={handleCreateBoxSubmit} style={{ background: '#fff', border: '1px solid #cbd5e0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: '0 0 5px 0' }}>Configure New Longbox/Shortbox</h4>
            <input type="text" placeholder="Box Label Name (e.g., DC Backissues Box 3)" value={newBoxName} onChange={e => setNewBoxName(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
            <input type="text" placeholder="Store Facility Location (e.g., Shelf C West)" value={newBoxLocation} onChange={e => setNewBoxLocation(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
            <button type="submit" style={{ background: '#48bb78', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Initialize Box Container</button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {boxes.map(box => {
            const metrics = boxValuations[box.id];
            return (
              <div key={box.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#2d3748' }}>{box.name}</h4>
                  <span style={{ background: '#edf2f7', color: '#4a5568', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>📍 {box.location}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#2d3748' }}>{metrics?.total_comics || 0} Books</div>
                  <div style={{ fontSize: '13px', color: '#2f855a', fontWeight: 'bold', marginTop: '2px' }}>
                    ${metrics?.financials?.total_estimated_retail_value.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* STICKY BOTTOM ACTIONS FOOTER LAYER */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', justifyContent: 'center', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)', zIndex: 100 }}>
        <button 
          onClick={() => setIsScannerOpen(true)}
          style={{ width: '100%', maxWidth: '500px', background: '#e53e3e', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(229, 62, 62, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          ➕ INTAKE BATCH SCAN PROCESSOR
        </button>
      </div>

      {/* FULL SCREEN FOCUSED BATCH INTAKE OVERLAY VIEWPORT */}
      {isScannerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 9990, overflowY: 'auto', padding: '20px' }}>
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #edf2f7', paddingBottom: '15px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Batch Logistics Setup</h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#718096' }}>Map destination box targeting matrix</p>
              </div>
              <button 
                onClick={() => setIsScannerOpen(false)}
                style={{ background: '#edf2f7', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#4a5568' }}
              >
                Close Intake
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '14px', color: '#4a5568' }}>Assign Destination Box Container:</label>
              <select 
                value={selectedBoxId} 
                onChange={e => setSelectedBoxId(e.target.value)} 
                style={{ width: '100%', padding: '12px', fontSize: '15px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
              >
                {boxes.map(b => (
                  <option key={b.id} value={b.id.toString()}>{b.name} ({b.location})</option>
                ))}
              </select>
            </div>

            {selectedBoxId && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <ComicScanner activeBoxId={parseInt(selectedBoxId, 10)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* GLOBAL APPARITION OF THE SIDE PANEL CHECKLIST DRAWER OVERLAY */}
      {activeSeriesFocus && (
        <SeriesVolumeViewer 
          title={activeSeriesFocus.title} 
          publisher={activeSeriesFocus.publisher} 
          onClose={() => setActiveSeriesFocus(null)} 
        />
      )}

    </div>
  );
}