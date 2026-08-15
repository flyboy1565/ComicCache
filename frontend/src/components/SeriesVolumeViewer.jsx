import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchSeriesOverview, fetchComicDetail, fetchCoverForIssue, addToPicklist, fetchComicVineOverview, fetchBoxes, importComicVineIssues, fetchLostSales, addLostSale, removeLostSale } from '../utilities/api';
import ComicBubbleIcon from './ComicBubbleIcon';
import ComicDetailModal from './ComicDetailModal';
import Skeleton from './Skeleton';
import styles from './SeriesVolumeViewer.module.css';

export default function SeriesVolumeViewer({ title, publisher, volumeId, onClose, showToast }) {
  const isExternal = Boolean(volumeId);
  const [seriesData, setSeriesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);
  const [selectedComic, setSelectedComic] = useState(null);
  const [comicLoading, setComicLoading] = useState(false);
  const swipeStartX = useRef(0);

  const [selectedIssues, setSelectedIssues] = useState(new Set());
  const [boxes, setBoxes] = useState([]);
  const [cvBoxId, setCvBoxId] = useState('');
  const [cvCreateBox, setCvCreateBox] = useState('');
  const [cvImporting, setCvImporting] = useState(false);

  const [lostSaleTarget, setLostSaleTarget] = useState(null); // { issues: [issue_number, ...] }
  const [lostSales, setLostSales] = useState([]);
  const [lostNotes, setLostNotes] = useState('');
  const [lostCustomerName, setLostCustomerName] = useState('');
  const [lostCustomerPhone, setLostCustomerPhone] = useState('');
  const [lostSaving, setLostSaving] = useState(false);

  const prepareLostSaleForm = async (issues) => {
    setLostSaleTarget({ issues });
    setLostNotes('');
    setLostCustomerName('');
    setLostCustomerPhone('');
    try {
      const all = await fetchLostSales();
      setLostSales(all || []);
    } catch {
      setLostSales([]);
    }
  };

  const openLostSaleModal = (item) => prepareLostSaleForm([item.issue_number]);

  const openBulkLostSaleModal = () => {
    const issues = (seriesData?.timeline || [])
      .filter(i => selectedIssues.has(i.issue_number) && i.status !== 'in_stock')
      .map(i => i.issue_number);
    if (issues.length === 0) {
      if (showToast) showToast('Select at least one missing issue', 'error');
      return;
    }
    prepareLostSaleForm(issues);
  };

  const isBulkLostSale = lostSaleTarget && lostSaleTarget.issues.length > 1;

  const existingLost = lostSaleTarget && lostSaleTarget.issues.length === 1
    ? lostSales.filter(s =>
        s.title === title &&
        s.publisher === (seriesData?.publisher || publisher) &&
        s.issue_number === lostSaleTarget.issues[0]
      )
    : [];

  const handleSaveLostSale = async () => {
    if (!lostSaleTarget || lostSaleTarget.issues.length === 0) return;
    setLostSaving(true);
    let saved = 0;
    try {
      for (const num of lostSaleTarget.issues) {
        await addLostSale({
          title,
          issue_number: num,
          publisher: seriesData?.publisher || publisher,
          notes: lostNotes.trim() || null,
          customer_name: lostCustomerName.trim() || null,
          customer_phone: lostCustomerPhone.trim() || null,
        });
        saved += 1;
      }
      if (showToast) showToast(saved === 1
        ? `Lost sale logged for #${lostSaleTarget.issues[0]}`
        : `Logged ${saved} lost sales`);
      setLostSaleTarget(null);
      if (isBulkLostSale) setSelectedIssues(new Set());
      loadSeries();
    } catch (e) {
      if (showToast) showToast(e.message || 'Failed to log lost sale', 'error');
    } finally {
      setLostSaving(false);
    }
  };

  const handleRemoveLostSale = async (saleId) => {
    try {
      await removeLostSale(saleId);
      const all = await fetchLostSales();
      setLostSales(all || []);
      loadSeries();
    } catch (e) {
      if (showToast) showToast(e.message || 'Failed to remove lost sale', 'error');
    }
  };

  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (dx > 80) onClose();
  };
  
  const [filterMode, setFilterMode] = useState('all');

  const loadSeries = () => {
    if (!title || !publisher) return;
    setLoading(true);
    const req = isExternal
      ? fetchComicVineOverview(volumeId)
      : fetchSeriesOverview(title, publisher);
    req
      .then(data => {
        setSeriesData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        if (showToast) showToast('Failed to load series', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSeries();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [title, publisher, volumeId]);

  useEffect(() => {
    if (isExternal) {
      fetchBoxes()
        .then(data => setBoxes(data || []))
        .catch(() => setBoxes([]));
    }
  }, [isExternal]);

  const handleCloseModal = useCallback(() => setSelectedComic(null), []);
  const handleViewSeries = useCallback(() => { setSelectedComic(null); }, []);
  const handleAddToPicklist = useCallback((item) => addToPicklist(item), []);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!isExternal && seriesData?.cover_gathering?.pending > 0) {
      pollRef.current = setInterval(() => {
        fetchSeriesOverview(title, publisher)
          .then(data => {
            setSeriesData(data);
            if (data.cover_gathering?.pending === 0) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          })
          .catch(() => {});
      }, 8000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [seriesData?.cover_gathering?.pending, title, publisher, isExternal]);

  const toggleIssue = (issueNumber) => {
    setSelectedIssues(prev => {
      const next = new Set(prev);
      if (next.has(issueNumber)) next.delete(issueNumber);
      else next.add(issueNumber);
      return next;
    });
  };

  const selectAllMissing = () => {
    setSelectedIssues(new Set(filteredTimeline.filter(i => i.status !== 'in_stock').map(i => i.issue_number)));
  };

  const deselectAll = () => setSelectedIssues(new Set());

  const handleImport = async () => {
    if (selectedIssues.size === 0) {
      if (showToast) showToast('Select at least one issue', 'error');
      return;
    }
    if (!cvBoxId && !cvCreateBox.trim()) {
      if (showToast) showToast('Select a box or enter a new box name', 'error');
      return;
    }
    setCvImporting(true);
    try {
      const selected = filteredTimeline
        .filter(t => selectedIssues.has(t.issue_number))
        .map(t => ({
          issue_number: t.issue_number,
          title: seriesData.series_title,
          publisher: seriesData.publisher,
          cover_image: t.cover_image,
        }));
      const result = await importComicVineIssues({
        box_id: cvBoxId ? parseInt(cvBoxId) : null,
        create_box: cvCreateBox.trim() || null,
        issues: selected,
      });
      if (showToast) showToast(`Added ${result.imported} issues to "${result.box_name}"`);
      setSelectedIssues(new Set());
      setCvBoxId('');
      setCvCreateBox('');
      loadSeries();
    } catch (e) {
      if (showToast) showToast(e.message || 'Import failed', 'error');
    } finally {
      setCvImporting(false);
    }
  };

  if (!title || !publisher) return null;

  const filteredTimeline = seriesData?.timeline.filter(item => {
    if (filterMode === 'have') return item.status === 'in_stock';
    if (filterMode === 'missing') return item.status !== 'in_stock';
    return true;
  }) || [];

  const gathering = seriesData?.cover_gathering;

  return (
    <>
      <div onClick={onClose} className={styles.overlay} />

      <div
        className={styles.drawer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <span className={styles.publisherLabel}>
                {publisher} COLLECTION
                {isExternal && <span className={styles.cvBadge}>🌐 ComicVine</span>}
              </span>
              <h2 className={styles.seriesTitle}>
                {title}
              </h2>
            </div>
            <button onClick={onClose} className={styles.closeBtn}>
              ✕
            </button>
          </div>

          {seriesData && (
            <div className={styles.filterRow}>
              
              <button
                onClick={() => setFilterMode(filterMode === 'have' ? 'all' : 'have')}
                className={`${styles.filterBtn} ${filterMode === 'have' ? styles.filterHaveActive : styles.filterHave}`}
              >
                🟩 Have: {seriesData.total_owned}
                {filterMode === 'have' && <span style={{ fontSize: '10px', marginLeft: '2px' }}>✕</span>}
              </button>

              <button
                onClick={() => setFilterMode(filterMode === 'missing' ? 'all' : 'missing')}
                className={`${styles.filterBtn} ${filterMode === 'missing' ? styles.filterMissingActive : styles.filterMissing}`}
              >
                🟥 Missing: {seriesData.total_missing}
                {filterMode === 'missing' && <span style={{ fontSize: '10px', marginLeft: '2px' }}>✕</span>}
              </button>

              {seriesData.total_lost_sales > 0 && (
                <div className={styles.lostValueBadge}>
                  💸 Lost: <strong className={styles.lostValueAmount}>{seriesData.total_lost_sales}</strong>
                </div>
              )}

              <div className={styles.valueBadge}>
                Value: <strong className={styles.valueAmount}>${seriesData.total_series_value.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {filterMode !== 'all' && (
            <div className={styles.activeFilter}>
              <span className={styles.activeFilterText}>
                Showing only <strong>{filterMode.toUpperCase()}</strong> variants ({filteredTimeline.length} items)
              </span>
              <button onClick={() => setFilterMode('all')} className={styles.clearFilterBtn}>
                Clear Filter ✕
              </button>
            </div>
          )}
        </div>

        {isExternal && seriesData && (
          <div className={styles.importBar}>
            <div className={styles.importBarTop}>
              <span className={styles.importCount}>{selectedIssues.size} selected</span>
              <div className={styles.importSelectActions}>
                <button onClick={selectAllMissing} className={styles.importSelectBtn}>Missing</button>
                <button onClick={deselectAll} className={styles.importSelectBtn}>None</button>
              </div>
            </div>
            <div className={styles.importRow}>
              <select value={cvBoxId} onChange={e => setCvBoxId(e.target.value)} className={styles.importBoxSelect}>
                <option value="">-- Existing box --</option>
                {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <span className={styles.importOr}>or</span>
              <input
                type="text" placeholder="New box name"
                value={cvCreateBox} onChange={e => setCvCreateBox(e.target.value)}
                className={styles.importBoxInput}
              />
              <button
                onClick={handleImport}
                disabled={cvImporting || selectedIssues.size === 0}
                className={styles.importBtn}
              >
                {cvImporting ? 'Importing...' : `Add ${selectedIssues.size}`}
              </button>
            </div>
            <div className={styles.lostSaleRow}>
              <button
                onClick={openBulkLostSaleModal}
                disabled={selectedIssues.size === 0}
                className={styles.lostSaleActionBtn}
              >
                💸 Log selected as lost sales
              </button>
            </div>
          </div>
        )}

        {gathering && !isExternal && gathering.pending > 0 && (
          <div className={styles.gatheringBanner}>
            <span style={{ fontSize: '14px' }}>🔄</span>
            <span>
              Gathering comic covers: <strong>{gathering.cached}</strong> found ·{' '}
              <strong>{gathering.pending}</strong> remaining
              {gathering.not_found > 0 && ` · ${gathering.not_found} unavailable`}
            </span>
          </div>
        )}

        <div className={styles.scrollArea}>
          {loading ? (
            <div className={styles.loadingText}>
              <Skeleton width="100%" height={32} count={8} />
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div className={styles.emptyText}>
              No issues match this filter view state.
            </div>
          ) : (
            filteredTimeline.map((item) => {
              const hasBook = item.status === 'in_stock';
              const checked = selectedIssues.has(item.issue_number);
              
              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    setComicLoading(true);
                    if (hasBook) {
                      fetchComicDetail(item.id)
                        .then(data => {
                          setSelectedComic(data);
                          setComicLoading(false);
                        })
                        .catch(() => setComicLoading(false));
                    } else {
                      fetchCoverForIssue(title, item.issue_number, publisher)
                        .then(data => {
                          setSelectedComic({
                            title: title,
                            issue_number: item.issue_number,
                            publisher: publisher,
                            barcode: null,
                            estimated_value: 0,
                            cover_image: data.cover_url,
                            cover_status: data.cover_status,
                            interest_count: data.interest_count,
                            date_scanned: null,
                            writer: null,
                            penciler: null,
                            keywords: null,
                            box: { name: item.box_name, location: item.box_location },
                          });
                          setComicLoading(false);
                        })
                        .catch(() => setComicLoading(false));
                    }
                  }}
                  className={`${styles.timelineItem} ${!hasBook ? styles.timelineItemMissing : ''}`}
                >
                  {isExternal && (
                    <div
                      className={`${styles.checkBox} ${checked ? styles.checkBoxChecked : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleIssue(item.issue_number); }}
                    >
                      {checked ? '✓' : ''}
                    </div>
                  )}
                  <div className={`${styles.coverBox} ${
                    item.cover_status === 'cached' ? styles.coverBoxCached
                    : item.cover_status === 'pending' ? styles.coverBoxPending
                    : hasBook ? styles.coverBoxHave
                    : styles.coverBoxMissing
                  }`}>
                    {item.cover_image ? (
                      <img src={item.cover_image} alt="" />
                    ) : item.cover_status === 'pending' ? (
                      <span className={styles.coverPlaceholder}>⏳</span>
                    ) : (
                      <ComicBubbleIcon size={14} color={hasBook ? '#48bb78' : '#fc8181'} />
                    )}
                  </div>

                  <div className={styles.metaArea}>
                    <div className={styles.metaTop}>
                      <span className={hasBook ? styles.haveBadge : styles.missingBadge}>
                        {hasBook ? 'HAVE' : 'MISSING'}
                      </span>
                      {!hasBook && item.lost_sale_count > 0 && (
                        <span className={styles.lostBadge}>
                          💸 LOST SALE{item.lost_sale_count > 1 ? ` ×${item.lost_sale_count}` : ''}
                        </span>
                      )}
                      <strong className={styles.issueNumber}>
                        Issue #{item.issue_number}
                      </strong>
                    </div>

                    {isExternal && item.issue_name && (
                      <div className={styles.issueName}>{item.issue_name}</div>
                    )}
                    
                    <div className={styles.boxLocation}>
                      {hasBook ? item.box_name : 'Not in vault'}
                    </div>
                  </div>

                  <div className={styles.financialCol}>
                    <div className={`${styles.issueValue} ${hasBook ? styles.issueValueHave : styles.issueValueMissing}`}>
                      {hasBook ? `$${item.estimated_value.toFixed(2)}` : '$0.00'}
                    </div>
                    {!hasBook && (
                      <button
                        className={styles.lostSaleBtn}
                        onClick={(e) => { e.stopPropagation(); openLostSaleModal(item); }}
                        title="Log lost sale"
                      >
                        💸 Log
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {comicLoading && (
        <div className={styles.loadingOverlay}>
          <Skeleton width="80%" height={40} count={3} />
        </div>
      )}

      {selectedComic && (
        <ComicDetailModal
          comic={selectedComic}
          onClose={handleCloseModal}
          onViewSeries={handleViewSeries}
          onAddToPicklist={handleAddToPicklist}
        />
      )}

      {lostSaleTarget && (
        <div className={styles.modalOverlay} onClick={() => setLostSaleTarget(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <strong>{isBulkLostSale ? `💸 Log ${lostSaleTarget.issues.length} lost sales` : '💸 Log lost sale'}</strong>
              <button onClick={() => setLostSaleTarget(null)} className={styles.modalClose}>✕</button>
            </div>
            <div className={styles.modalSub}>
              {isBulkLostSale ? (
                <>Logging for issues: <strong>#{lostSaleTarget.issues.join(', #')}</strong></>
              ) : (
                <>Customer wanted <strong>{title}</strong> Issue #{lostSaleTarget.issues[0]} — you didn't have it.</>
              )}
            </div>

            {existingLost.length > 0 && (
              <div className={styles.existingList}>
                {existingLost.map(s => (
                  <div key={s.id} className={styles.existingRow}>
                    <span className={styles.existingInfo}>
                      <strong>{s.lost_date}</strong>
                      {s.customer_name ? ` — ${s.customer_name}` : ''}
                      {s.customer_phone ? ` (${s.customer_phone})` : ''}
                      {s.notes ? ` · ${s.notes}` : ''}
                    </span>
                    <button className={styles.existingRemove} onClick={() => handleRemoveLostSale(s.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalField}>
              <label>Notes</label>
              <input
                type="text"
                value={lostNotes} onChange={e => setLostNotes(e.target.value)}
                placeholder="e.g. customer asked for it, wants #5 too"
              />
            </div>
            <div className={styles.modalField}>
              <label>Customer name (optional)</label>
              <input
                type="text"
                value={lostCustomerName} onChange={e => setLostCustomerName(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className={styles.modalField}>
              <label>Customer telephone (optional)</label>
              <input
                type="tel"
                value={lostCustomerPhone} onChange={e => setLostCustomerPhone(e.target.value)}
                placeholder="e.g. (555) 123-4567"
              />
            </div>
            <div className={styles.modalDateNote}>
              Entered on <strong>{new Date().toLocaleDateString()}</strong>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setLostSaleTarget(null)}>Cancel</button>
              <button className={styles.modalSave} onClick={handleSaveLostSale} disabled={lostSaving}>
                {lostSaving ? 'Saving...' : isBulkLostSale ? `Log ${lostSaleTarget.issues.length}` : 'Log lost sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
