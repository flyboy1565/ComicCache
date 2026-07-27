import React, { useState, useRef } from 'react';
import { searchComicVineSeries, fetchComicVineIssues, importComicVineIssues, fetchBoxes } from '../utilities/api';
import Skeleton from './Skeleton';
import styles from './ComicVineBrowser.module.css';

export default function ComicVineBrowser({ onClose, showToast }) {
  const [query, setQuery] = useState('');
  const [publisher, setPublisher] = useState('');
  const [seriesResults, setSeriesResults] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [selectedIssueNumbers, setSelectedIssueNumbers] = useState(new Set());
  const [boxes, setBoxes] = useState([]);
  const [boxId, setBoxId] = useState('');
  const [createBox, setCreateBox] = useState('');
  const [importing, setImporting] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoadingSeries(true);
    setSelectedSeries(null);
    setIssues([]);
    setSelectedIssueNumbers(new Set());
    try {
      const data = await searchComicVineSeries(query.trim(), publisher || null);
      setSeriesResults(data.results || []);
    } catch (e) {
      showToast?.('Failed to search ComicVine', 'error');
    } finally {
      setLoadingSeries(false);
    }
  };

  const handleSelectSeries = async (series) => {
    setSelectedSeries(series);
    setSelectedIssueNumbers(new Set());
    setLoadingIssues(true);
    try {
      const data = await fetchComicVineIssues(series.id);
      setIssues(data.issues || []);
      const boxesData = await fetchBoxes();
      setBoxes(boxesData);
    } catch (e) {
      showToast?.('Failed to load issues', 'error');
    } finally {
      setLoadingIssues(false);
    }
  };

  const toggleIssue = (issueNumber) => {
    setSelectedIssueNumbers(prev => {
      const next = new Set(prev);
      if (next.has(issueNumber)) next.delete(issueNumber);
      else next.add(issueNumber);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIssueNumbers(new Set(issues.map(i => i.issue_number)));
  };

  const deselectAll = () => {
    setSelectedIssueNumbers(new Set());
  };

  const handleImport = async () => {
    if (selectedIssueNumbers.size === 0) {
      showToast?.('Select at least one issue', 'error');
      return;
    }
    if (!boxId && !createBox.trim()) {
      showToast?.('Select a box or enter a new box name', 'error');
      return;
    }
    setImporting(true);
    try {
      const selectedIssues = issues
        .filter(i => selectedIssueNumbers.has(i.issue_number))
        .map(i => ({
          issue_number: i.issue_number,
          title: selectedSeries.title,
          publisher: selectedSeries.publisher,
          cover_image: i.cover_image,
        }));
      const result = await importComicVineIssues({
        box_id: boxId ? parseInt(boxId) : null,
        create_box: createBox.trim() || null,
        issues: selectedIssues,
      });
      showToast?.(`Added ${result.imported} issues to "${result.box_name}"`);
      setSelectedIssueNumbers(new Set());
    } catch (e) {
      showToast?.(e.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>🌐 Browse ComicVine</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.searchRow}>
          <input
            type="text"
            placeholder="Search series (e.g., Superman)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <input
            type="text"
            placeholder="Filter by publisher (optional)"
            value={publisher}
            onChange={e => setPublisher(e.target.value)}
            className={styles.publisherInput}
          />
          <button onClick={handleSearch} disabled={loadingSeries} className={styles.searchBtn}>
            {loadingSeries ? '...' : 'Search'}
          </button>
        </div>

        {loadingSeries && (
          <div className={styles.loadingArea}>
            <Skeleton width="100%" height={48} count={4} />
          </div>
        )}

        {!selectedSeries && !loadingSeries && seriesResults.length > 0 && (
          <div className={styles.seriesList}>
            {seriesResults.map((s, i) => (
              <div key={i} onClick={() => handleSelectSeries(s)} className={styles.seriesCard}>
                <div className={styles.seriesInfo}>
                  <strong className={styles.seriesName}>{s.title}</strong>
                  <div className={styles.seriesMeta}>
                    {s.publisher} · {s.issue_count} issues{s.start_year ? ` · since ${s.start_year}` : ''}
                  </div>
                </div>
                <span className={styles.seriesArrow}>➔</span>
              </div>
            ))}
          </div>
        )}

        {!loadingSeries && seriesResults.length === 0 && query && (
          <div className={styles.emptyText}>No series found. Try a different search.</div>
        )}

        {selectedSeries && (
          <div className={styles.issuesSection}>
            <div className={styles.issuesHeader}>
              <div>
                <h3 className={styles.issuesTitle}>{selectedSeries.title}</h3>
                <span className={styles.issuesSubtitle}>{selectedSeries.publisher}</span>
              </div>
              <div className={styles.issuesActions}>
                <button onClick={selectAll} className={styles.selectBtn}>Select All</button>
                <button onClick={deselectAll} className={styles.selectBtn}>Deselect All</button>
              </div>
            </div>

            <div className={styles.issuesCount}>
              {selectedIssueNumbers.size} of {issues.length} selected
            </div>

            {loadingIssues ? (
              <div className={styles.loadingArea}>
                <Skeleton width="100%" height={48} count={6} />
              </div>
            ) : (
              <div className={styles.issuesGrid}>
                {issues.map((issue) => {
                  const checked = selectedIssueNumbers.has(issue.issue_number);
                  return (
                    <div
                      key={issue.id || issue.issue_number}
                      onClick={() => toggleIssue(issue.issue_number)}
                      className={`${styles.issueCard} ${checked ? styles.issueCardSelected : ''}`}
                    >
                      <div className={styles.issueCover}>
                        {issue.cover_image ? (
                          <img src={issue.cover_image} alt="" />
                        ) : (
                          <div className={styles.coverPlaceholder}>📘</div>
                        )}
                      </div>
                      <div className={styles.issueLabel}>
                        <span className={styles.issueNum}>#{issue.issue_number}</span>
                        {issue.name && <span className={styles.issueName}>{issue.name}</span>}
                      </div>
                      <div className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}>
                        {checked ? '✓' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {issues.length === 0 && !loadingIssues && (
              <div className={styles.emptyText}>No issues found for this series.</div>
            )}

            <div className={styles.importRow}>
              <div className={styles.importBoxSelect}>
                <select value={boxId} onChange={e => setBoxId(e.target.value)} className={styles.boxSelect}>
                  <option value="">-- Existing box --</option>
                  {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <span className={styles.importOr}>or</span>
                <input
                  type="text" placeholder="New box name"
                  value={createBox} onChange={e => setCreateBox(e.target.value)}
                  className={styles.boxInput}
                />
              </div>
              <button
                onClick={handleImport}
                disabled={importing || selectedIssueNumbers.size === 0}
                className={styles.importBtn}
              >
                {importing ? 'Importing...' : `Add ${selectedIssueNumbers.size} to Box`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
