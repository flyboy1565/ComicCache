import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { postBarcodeScan } from '../utilities/api';
import { soundFX } from '../utilities/audio';
import styles from './ComicScanner.module.css';

export default function ComicScanner({ activeBoxId }) {
  const scannerRef = useRef(null);
  const isTransitioningRef = useRef(false);
  
  const scannedBarcodesRef = useRef(new Set());

  const [isManualMode, setIsManualMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing scanning matrix...");
  const [batchQueue, setBatchQueue] = useState([]);
  
  const [manualUpc, setManualUpc] = useState('');
  const [manualExtension, setManualExtension] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const hasGetUserMedia = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
    console.log("MediaDevices API available:", hasGetUserMedia);
    console.log("navigator.mediaDevices:", navigator.mediaDevices);
    console.log("Current origin:", window.location.origin);
    console.log("Is secure context:", window.isSecureContext);
    if (!hasGetUserMedia) {
      setStatusMessage("Camera not supported in this browser context (no mediaDevices API). Try HTTPS or a different browser.");
    }
  }, []);

  useEffect(() => {
    if (isManualMode) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        isTransitioningRef.current = true;
        scannerRef.current.stop()
          .then(() => {
            scannerRef.current = null;
            isTransitioningRef.current = false;
          })
          .catch(err => {
            console.error("Error stopping scanner instance:", err);
            isTransitioningRef.current = false;
          });
      }
      return;
    }

    if (isTransitioningRef.current) return;

    const freshScannerInstance = new Html5Qrcode("scanner-view");
    scannerRef.current = freshScannerInstance;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('environment')
          );
          const cameraId = backCamera ? backCamera.id : devices[0].id;

          if (!isManualMode && scannerRef.current === freshScannerInstance) {
            isTransitioningRef.current = true;
            return freshScannerInstance.start(
              cameraId,
              {
                fps: 15,
                qrbox: { width: 300, height: 130 },
                formatsToSupport: [
                  Html5QrcodeSupportedFormats.EAN_13,
                  Html5QrcodeSupportedFormats.UPC_A
                ]
              },
              (decodedText) => handleBarcodeProcessed(decodedText),
              () => {} 
            ).then(() => {
              isTransitioningRef.current = false;
              setStatusMessage("Continuous 17-Digit Radar Active. Swipe items freely.");
            });
          }
        } else {
          setStatusMessage("No tracking lens hardware located.");
        }
      })
      .catch((err) => {
        isTransitioningRef.current = false;
        console.error("Full camera error:", err, "type:", typeof err, "keys:", Object.keys(err));
        if (!err.message?.includes("already under transition")) {
          setStatusMessage(`Camera setup status: ${err.message || err.name || "Unknown error"}`);
        }
      });

    return () => {
      if (freshScannerInstance && freshScannerInstance.isScanning) {
        isTransitioningRef.current = true;
        freshScannerInstance.stop()
          .then(() => {
            isTransitioningRef.current = false;
          })
          .catch(err => {
            console.error("Teardown tracking error:", err);
            isTransitioningRef.current = false;
          });
      }
    };
  }, [activeBoxId, isManualMode]);

  const handleBarcodeProcessed = (barcode) => {
    const cleanBarcode = barcode.trim();
    console.log("Scanned barcode:", cleanBarcode);

    if (scannedBarcodesRef.current.has(cleanBarcode)) {
      return;
    }

    scannedBarcodesRef.current.add(cleanBarcode);

    soundFX.playCaptureBeep();

    const newQueueItem = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      barcode: cleanBarcode,
      title: "Resolving catalog data...",
      status: "pending"
    };

    setBatchQueue(prev => [newQueueItem, ...prev]);
  };

  useEffect(() => {
    const nextPendingItem = [...batchQueue].reverse().find(item => item.status === 'pending');
    if (!nextPendingItem) return;

    setBatchQueue(currentQueue => 
      currentQueue.map(item => item.id === nextPendingItem.id ? { ...item, status: 'processing' } : item)
    );

    const scanPayload = {
      barcode: nextPendingItem.barcode,
      box_id: intIntakeConv(activeBoxId)
    };

    console.log("Dispatching scan payload:", scanPayload);

    postBarcodeScan(scanPayload)
      .then((response) => {
        console.log("Scan response:", response);
        if (response.status === "already_exists") {
          soundFX.playFailureBuzz();
          updateItemStatus(nextPendingItem.id, { 
            title: "Duplicate Book", 
            status: "error", 
            detail: "This item already exists in this box." 
          });
        } else {
          soundFX.playLookupSuccess();
          updateItemStatus(nextPendingItem.id, {
            title: response.data.title ? `${response.data.title} #${response.data.issue_number || '?'}` : "Unknown Title",
            status: "success",
            value: response.data.estimated_value || 0.00
          });
        }
      })
      .catch((err) => {
        soundFX.playFailureBuzz();
        updateItemStatus(nextPendingItem.id, { 
          title: "Resolution Failed", 
          status: "error", 
          detail: err.message || "Barcode database mismatch." 
        });
      })
      .finally(() => {
        setTimeout(() => {
          scannedBarcodesRef.current.delete(nextPendingItem.barcode);
        }, 2500);
      });
  }, [batchQueue, activeBoxId]);

  const intIntakeConv = (id) => {
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? id : parsed;
  };

  const updateItemStatus = (id, fields) => {
    setBatchQueue(currentQueue =>
      currentQueue.map(item => item.id === id ? { ...item, ...fields } : item)
    );
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUpc = manualUpc.trim();
    const cleanExt = manualExtension.trim();

    if (cleanUpc.length !== 12 || !/^\d+$/.test(cleanUpc)) {
      setErrorMessage('The main UPC barcode must be exactly 12 digits.');
      return;
    }
    if (cleanExt.length > 0 && (cleanExt.length !== 5 || !/^\d+$/.test(cleanExt))) {
      setErrorMessage('The issue extension must be exactly 5 digits.');
      return;
    }

    const fullBarcode = cleanExt ? `${cleanUpc}${cleanExt}` : cleanUpc;
    
    scannedBarcodesRef.current.delete(fullBarcode);
    handleBarcodeProcessed(fullBarcode);

    setManualUpc('');
    setManualExtension('');
  };

  const getItemClass = (status) => {
    switch(status) {
      case 'success': return `${styles.batchItem} ${styles.batchItemSuccess}`;
      case 'error': return `${styles.batchItem} ${styles.batchItemError}`;
      case 'processing': return `${styles.batchItem} ${styles.batchItemProcessing}`;
      default: return `${styles.batchItem} ${styles.batchItemPending}`;
    }
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.statusBar}>
        <div className={styles.statusLabel}>
          {isManualMode ? "⌨️ Manual Mode Active" : `📡 Camera: ${statusMessage}`}
        </div>
        <button 
          onClick={() => { setIsManualMode(!isManualMode); setErrorMessage(''); }}
          className={styles.modeToggle}
        >
          {isManualMode ? 'Switch to Camera' : 'Manual Entry'}
        </button>
      </div>

      {errorMessage && (
        <div className={styles.errorBanner}>
          ⚠️ {errorMessage}
        </div>
      )}

      {!isManualMode ? (
        <div id="scanner-view" className={styles.scannerView} />
      ) : (
        <form onSubmit={handleManualSubmit} className={styles.manualForm}>
          <div>
            <label className={styles.fieldLabel}>MAIN UPC CODE (12 DIGITS)</label>
            <input 
              type="text" pattern="\d*" maxLength="12" placeholder="e.g., 761941393445" value={manualUpc}
              onChange={e => setManualUpc(e.target.value.replace(/\D/g, ''))} required
              className={styles.manualInput}
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>ISSUE EXTENSION (5 DIGITS)</label>
            <input 
              type="text" pattern="\d*" maxLength="5" placeholder="e.g., 00121" value={manualExtension}
              onChange={e => setManualExtension(e.target.value.replace(/\D/g, ''))}
              className={styles.manualInput}
            />
          </div>
          <button type="submit" className={styles.submitBtn}>
            Process Variant Metadata
          </button>
        </form>
      )}

      <div className={styles.batchSection}>
        <h4 className={styles.batchTitle}>📦 Staging Processing Batch ({batchQueue.length} items)</h4>
        <div className={styles.batchList}>
          {batchQueue.map((item) => (
            <div key={item.id} className={getItemClass(item.status)}>
              <div>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemBarcode}>Code: {item.barcode}</div>
                {item.detail && <div className={styles.itemDetail}>{item.detail}</div>}
              </div>
              <div>
                {item.status === 'processing' && <span className={styles.statusProcessing}>LOOKING UP...</span>}
                {item.status === 'success' && <span className={styles.statusSuccess}>+ ${item.value}</span>}
                {item.status === 'error' && <span className={styles.statusError}>SKIPPED</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
