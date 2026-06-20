import React, { useState, useEffect, useCallback, useRef } from 'react';
import ComicScanner from '../components/ComicScanner';
import BoxDetailScreen from '../components/BoxDetailScreen';
import PicklistDrawer from '../components/PicklistDrawer';
import Toast from '../components/Toast';
import SeriesVolumeViewer from '../components/SeriesVolumeViewer';
import UserMenu from '../components/UserMenu';
import RegisterScreen from '../screens/RegisterScreen';
import AdminScreen from '../screens/AdminScreen';
import BottomNav from '../components/BottomNav';
import { fetchBoxes, fetchValuation, createBox, searchComics, addToPicklist } from '../utilities/api';
import styles from './DashboardScreen.module.css';

export default function DashboardScreen({ user, onLogout }) {
  const [boxes, setBoxes] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [boxValuations, setBoxValuations] = useState({});
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewBoxFormOpen, setIsNewBoxFormOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBoxForDetail, setSelectedBoxForDetail] = useState(null);

  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY <= 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (window.scrollY <= 0 && pullStartY.current > 0) {
      const dist = e.touches[0].clientY - pullStartY.current;
      if (dist > 0) {
        setPullDistance(Math.min(dist * 0.4, 80));
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= 60) {
      setRefreshing(true);
      setPullDistance(0);
      loadVaultData();
      setTimeout(() => setRefreshing(false), 800);
    } else {
      setPullDistance(0);
    }
    pullStartY.current = 0;
  }, [pullDistance]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const handleAddStaff = () => setCurrentView('register');
  const handleManageStaff = () => setCurrentView('admin');

  const handleRegistered = (username) => {
    setCurrentView('dashboard');
    showToast(`Account "${username}" created`);
  };

  const handleCancelRegister = () => setCurrentView('dashboard');

  const [isPicklistOpen, setIsPicklistOpen] = useState(false);
  const [bottomNavTab, setBottomNavTab] = useState('home');

  const handleBottomNavPress = (tab) => {
    setBottomNavTab(tab);
    switch (tab) {
      case 'scan':
        setIsScannerOpen(true);
        break;
      case 'picklist':
        setIsPicklistOpen(true);
        break;
      default:
        break;
    }
  };

  const handleCloseScanner = () => {
    setIsScannerOpen(false);
    setBottomNavTab('home');
  };

  const handleClosePicklist = () => {
    setIsPicklistOpen(false);
    setBottomNavTab('home');
  };

  const handleAddToPicklist = async (item) => {
    try {
      await addToPicklist(item);
      showToast('Added to picklist!');
    } catch (e) {
      console.error("Failed to add to picklist:", e);
      showToast('Failed to add to picklist', 'error');
    }
  };

  const [activeSeriesFocus, setActiveSeriesFocus] = useState(null);

  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxLocation, setNewBoxLocation] = useState('');

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
        loadVaultData();
      });
  };

  const globalTotalBooks = Object.values(boxValuations).reduce((acc, curr) => acc + (curr?.total_comics || 0), 0);
  const globalMarketValue = Object.values(boxValuations).reduce((acc, curr) => acc + (curr?.financials?.total_estimated_retail_value || 0), 0);

  return (
    <div
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {refreshing && (
        <div className={styles.refreshIndicator}>↻ Refreshing...</div>
      )}

      <div
        className={styles.pullIndicator}
        style={{
          height: pullDistance,
          opacity: pullDistance > 0 ? Math.min(pullDistance / 60, 1) : 0,
          transition: pullDistance === 0 ? 'height 0.3s, opacity 0.3s' : 'none',
        }}
      >
        {pullDistance >= 60 ? 'Release to refresh' : 'Pull to refresh'}
      </div>
      
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>⚡ ComicCache </h1>
          <p className={styles.headerSubtitle}> Store Collection </p>
        </div>
        <div className={styles.headerRight}>
          {user && <UserMenu user={user} onLogout={onLogout} onAddStaff={handleAddStaff} onNavigate={handleManageStaff} />}
        </div>
      </header>

      {currentView === 'register' ? (
        <RegisterScreen onRegistered={handleRegistered} onCancel={handleCancelRegister} />
      ) : currentView === 'admin' ? (
        <AdminScreen user={user} onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'box-detail' && selectedBoxForDetail ? (
        <BoxDetailScreen
          box={selectedBoxForDetail}
          onBack={() => setCurrentView('dashboard')}
          onViewSeries={(title, publisher) => setActiveSeriesFocus({ title, publisher })}
          onAddToPicklist={handleAddToPicklist}
        />
      ) : (
        <></>
      )}

      {currentView === 'dashboard' && (
      <>

      <section className={styles.searchSection}>
        <input 
          type="text"
          placeholder="🔍 Quick search catalog by title, creator, tag, or barcode..."
          value={globalSearchQuery}
          onChange={e => setGlobalSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </section>

      {globalSearchQuery.trim().length >= 2 && (
        <section className={styles.searchResults}>
          <div className={styles.searchResultsHeader}>
            <h3 className={styles.searchResultsTitle}>Query Results</h3>
            <button onClick={() => { setGlobalSearchQuery(''); setSearchResults([]); }} className={styles.btnGhost}>Clear</button>
          </div>

          <div className={styles.seriesSection}>
            <h4 className={styles.seriesSectionTitle}>📚 Matching Series Runs</h4>
            <div className={styles.seriesList}>
              {Array.from(new Set(searchResults.map(c => `${c.title}|||${c.publisher}`))).map(seriesKey => {
                const [title, publisher] = seriesKey.split('|||');
                const totalInVault = searchResults.filter(c => c.title === title && c.publisher === publisher).length;

                return (
                  <div 
                    key={seriesKey} 
                    onClick={() => setActiveSeriesFocus({ title, publisher })}
                    className={styles.seriesCard}
                  >
                    <div>
                      <strong className={styles.seriesCardTitle}>{title}</strong>
                      <div className={styles.seriesCardPublisher}>{publisher}</div>
                    </div>
                    <span className={styles.seriesCardAction}>
                      Open Run Timeline ({totalInVault} owned) ➔
                    </span>
                  </div>
                );
              })}
              {searchResults.length === 0 && <div className={styles.emptyState}>No matching series found.</div>}
            </div>
          </div>

          <div className={styles.copiesSection}>
            <h4 className={styles.copiesSectionTitle}>🔍 Exact Copies In Vault</h4>
            <div className={styles.copiesList}>
              {searchResults.map(comic => (
                <div key={comic.id} className={styles.copyCard}>
                  <div>
                    <span className={styles.copyCardTitle}>{comic.title} #{comic.issue_number}</span>
                    <div className={styles.copyCardLocation}>Location: Box "{comic.box_name}" ({comic.box_location})</div>
                  </div>
                  <span className={styles.copyCardValue}>${comic.estimated_value.toFixed(2)}</span>
                </div>
              ))}
              {searchResults.length === 0 && <div className={styles.emptyState}>No specific matching variants located.</div>}
            </div>
          </div>

        </section>
      )}

      <section className={styles.financialSection}>
        <h4 className={styles.financialLabel}>Total Cache Worth</h4>
        <div className={styles.financialValue}>${globalMarketValue.toFixed(2)}</div>
        <div className={styles.financialDetail}>Aggregated asset balance across <strong>{globalTotalBooks}</strong> inventoried items</div>
      </section>

      <section className={styles.containersSection}>
        <div className={styles.containersHeader}>
          <h3 className={styles.containersTitle}>📦 Storage Containers</h3>
          <button 
            onClick={() => setIsNewBoxFormOpen(!isNewBoxFormOpen)}
            className={styles.btnMuted}
          >
            {isNewBoxFormOpen ? "Cancel" : "+ New Container"}
          </button>
        </div>

        {isNewBoxFormOpen && (
          <form onSubmit={handleCreateBoxSubmit} className={styles.newBoxForm}>
            <h4 className={styles.newBoxFormTitle}>Configure New Longbox/Shortbox</h4>
            <input type="text" placeholder="Box Label Name (e.g., DC Backissues Box 3)" value={newBoxName} onChange={e => setNewBoxName(e.target.value)} required className={styles.newBoxInput} />
            <input type="text" placeholder="Store Facility Location (e.g., Shelf C West)" value={newBoxLocation} onChange={e => setNewBoxLocation(e.target.value)} required className={styles.newBoxInput} />
            <button type="submit" className={styles.btnSuccess}>Initialize Box Container</button>
          </form>
        )}

        <div className={styles.containerList}>
          {boxes.map(box => {
            const metrics = boxValuations[box.id];
            return (
              <div
                key={box.id}
                onClick={() => { setCurrentView('box-detail'); setSelectedBoxForDetail(box); }}
                className={styles.containerCard}
              >
                <div>
                  <h4 className={styles.containerCardName}>{box.name}</h4>
                  <span className={styles.containerCardLocation}>📍 {box.location}</span>
                </div>
                <div className={styles.containerCardStats}>
                  <div className={styles.containerCardCount}>{metrics?.total_comics || 0} Books</div>
                  <div className={styles.containerCardValue}>
                    ${metrics?.financials?.total_estimated_retail_value.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      </>
      )}

      {isScannerOpen && (
        <div className={styles.scannerOverlay}>
          <div className={styles.scannerInner}>
            
            <div className={styles.scannerHeader}>
              <div>
                <h2 className={styles.scannerTitle}>Batch Logistics Setup</h2>
                <p className={styles.scannerSubtitle}>Map destination box targeting matrix</p>
              </div>
              <button 
                onClick={handleCloseScanner}
                className={styles.btnMuted}
              >
                Close Intake
              </button>
            </div>

            <div className={styles.scannerBoxSelect}>
              <label className={styles.scannerLabel}>Assign Destination Box Container:</label>
              <select 
                value={selectedBoxId} 
                onChange={e => setSelectedBoxId(e.target.value)} 
                className={styles.scannerSelect}
              >
                {boxes.map(b => (
                  <option key={b.id} value={b.id.toString()}>{b.name} ({b.location})</option>
                ))}
              </select>
            </div>

            {selectedBoxId && (
              <div className={styles.scannerComicWrapper}>
                <ComicScanner activeBoxId={parseInt(selectedBoxId, 10)} />
              </div>
            )}
          </div>
        </div>
      )}

      {isPicklistOpen && (
        <PicklistDrawer onClose={handleClosePicklist} showToast={showToast} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {activeSeriesFocus && (
        <SeriesVolumeViewer 
          title={activeSeriesFocus.title} 
          publisher={activeSeriesFocus.publisher} 
          onClose={() => setActiveSeriesFocus(null)} 
        />
      )}

      <BottomNav
        activeTab={bottomNavTab}
        onTabPress={handleBottomNavPress}
        user={user}
      />

    </div>
  );
}
