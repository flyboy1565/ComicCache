// src/components/ComicScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { postBarcodeScan } from '../utilities/api';
import { soundFX } from '../utilities/audio';

export default function ComicScanner({ activeBoxId }) {
  const scannerRef = useRef(null);
  const isTransitioningRef = useRef(false);
  
  // 💡 FAST GATEKEEPER LOCK: Tracks active scans synchronously to beat the hardware race condition
  const scannedBarcodesRef = useRef(new Set());

  // Operational States
  const [isManualMode, setIsManualMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing scanning matrix...");
  const [batchQueue, setBatchQueue] = useState([]);
  
  // Manual Form States
  const [manualUpc, setManualUpc] = useState('');
  const [manualExtension, setManualExtension] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // PHASE 1: CAMERA ENGINE LIFECYCLE MANAGEMENT
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
        if (!err.message?.includes("already under transition")) {
          setStatusMessage(`Camera setup status: ${err.message}`);
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

  // PHASE 2: PROCESSING INCOMING SCAN DATA
  const handleBarcodeProcessed = (barcode) => {
    const cleanBarcode = barcode.trim();
    console.log("Scanned barcode:", cleanBarcode);

    // 🛑 LOCK CHECK: If barcode is currently processing or inside the cooldown safety window, drop it instantly
    if (scannedBarcodesRef.current.has(cleanBarcode)) {
      return;
    }

    // 🔒 ENGAGE LOCK: Freeze this specific barcode string synchronously
    scannedBarcodesRef.current.add(cleanBarcode);

    // Play initial capture sound instantly
    soundFX.playCaptureBeep();

    const newQueueItem = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      barcode: cleanBarcode,
      title: "Resolving catalog data...",
      status: "pending"
    };

    setBatchQueue(prev => [newQueueItem, ...prev]);
  };

  // PHASE 3: ASYNC BACKGROUND WORKER LOOP
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
        // ⏳ COOLDOWN WINDOW: Wait 2.5 seconds after a book completes processing before letting
        // the camera read that specific barcode value ever again. Gives plenty of time to pull the book away.
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

  // PHASE 4: MANUAL ENTRY SUBMISSION PARSER
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
    
    // Bypass the local ref check explicitly for manual submit requests if you want to retry a known item
    scannedBarcodesRef.current.delete(fullBarcode);
    handleBarcodeProcessed(fullBarcode);

    setManualUpc('');
    setManualExtension('');
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'success': return { borderLeft: '4px solid #48bb78', background: '#e6fffa' };
      case 'error': return { borderLeft: '4px solid #f56565', background: '#fff5f5' };
      case 'processing': return { borderLeft: '4px solid #ecc94b', background: '#fffff0' };
      default: return { borderLeft: '4px solid #cbd5e0', background: '#f7fafc' };
    }
  };

  return (
    <div style={{ padding: '15px', background: '#1a202c', color: '#fff', borderRadius: '10px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ fontSize: '13px', background: '#2d3748', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
          {isManualMode ? "⌨️ Manual Mode Active" : `📡 Camera: ${statusMessage}`}
        </div>
        <button 
          onClick={() => { setIsManualMode(!isManualMode); setErrorMessage(''); }}
          style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isManualMode ? 'Switch to Camera' : 'Manual Entry'}
        </button>
      </div>

      {errorMessage && (
        <div style={{ background: '#742a2a', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {!isManualMode ? (
        <div id="scanner-view" style={{ width: '100%', minHeight: '180px', background: '#2d3748', borderRadius: '8px', overflow: 'hidden' }} />
      ) : (
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px', fontWeight: 'bold' }}>MAIN UPC CODE (12 DIGITS)</label>
            <input 
              type="text" pattern="\d*" maxLength="12" placeholder="e.g., 761941393445" value={manualUpc}
              onChange={e => setManualUpc(e.target.value.replace(/\D/g, ''))} required
              style={{ width: '100%', padding: '12px', background: '#2d3748', border: '1px solid #4a5568', borderRadius: '6px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px', fontWeight: 'bold' }}>ISSUE EXTENSION (5 DIGITS)</label>
            <input 
              type="text" pattern="\d*" maxLength="5" placeholder="e.g., 00121" value={manualExtension}
              onChange={e => setManualExtension(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', padding: '12px', background: '#2d3748', border: '1px solid #4a5568', borderRadius: '6px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ width: '100%', background: '#3182ce', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
            Process Variant Metadata
          </button>
        </form>
      )}

      <div style={{ marginTop: '20px', borderTop: '1px solid #2d3748', paddingTop: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#cbd5e0', fontSize: '14px' }}>📦 Staging Processing Batch ({batchQueue.length} items)</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {batchQueue.map((item) => (
            <div key={item.id} style={{ ...getStatusStyle(item.status), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '4px', fontSize: '13px', color: '#1a202c' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: '#4a5568' }}>Code: {item.barcode}</div>
                {item.detail && <div style={{ fontSize: '11px', color: '#c53030', marginTop: '2px', fontWeight: 'bold' }}>{item.detail}</div>}
              </div>
              <div>
                {item.status === 'processing' && <span style={{ color: '#b7791f', fontWeight: 'bold', fontSize: '11px' }}>LOOKING UP...</span>}
                {item.status === 'success' && <span style={{ color: '#22543d', fontWeight: 'bold' }}>+ ${item.value}</span>}
                {item.status === 'error' && <span style={{ color: '#742a2a', fontWeight: 'bold' }}>SKIPPED</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}