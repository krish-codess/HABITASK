import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { scanBarcode } from '../../api/barcode.js';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function BarcodeScanner({ onFound, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);
  const htmlScannerRef = useRef(null);

  const startScanner = async () => {
    setScanning(true);
    setError('');
    try {
      const scanner = new Html5Qrcode('qr-reader');
      htmlScannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.5 },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          await fetchProduct(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setError('Camera access denied or not available. Try entering barcode manually.');
    }
  };

  const stopScanner = async () => {
    try {
      if (htmlScannerRef.current) {
        await htmlScannerRef.current.stop();
        htmlScannerRef.current = null;
      }
    } catch {}
    setScanning(false);
  };

  const fetchProduct = async (code) => {
    setLoading(true);
    setError('');
    try {
      const data = await scanBarcode(code);
      setProduct(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Product not found. Try a different barcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleManual = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await fetchProduct(manualCode.trim());
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="space-y-4">
      {/* Scanner Area */}
      {!product && (
        <>
          <div
            id="qr-reader"
            className="rounded-2xl overflow-hidden bg-slate-900 min-h-48"
            ref={scannerRef}
          />

          {!scanning ? (
            <button onClick={startScanner} className="btn-primary w-full flex items-center justify-center gap-2">
              <span>📷</span> Start Camera Scanner
            </button>
          ) : (
            <button onClick={stopScanner} className="btn-danger w-full">
              Stop Scanner
            </button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-800 px-3 text-slate-500">or enter manually</span>
            </div>
          </div>

          <form onSubmit={handleManual} className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Enter barcode number"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <button type="submit" className="btn-secondary flex-shrink-0">
              Search
            </button>
          </form>
        </>
      )}

      {loading && (
        <div className="flex flex-col items-center py-6 gap-3">
          <LoadingSpinner />
          <p className="text-sm text-slate-400">Fetching product data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
          {error}
          <button onClick={() => { setError(''); setProduct(null); setManualCode(''); }} className="ml-2 underline">Try again</button>
        </div>
      )}

      {product && (
        <div className="space-y-4">
          <div className="card">
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-contain rounded-xl mb-3 mx-auto bg-white" />
            )}
            <h3 className="font-bold text-lg text-slate-100 text-center">{product.name}</h3>
            {product.brand && <p className="text-sm text-slate-400 text-center">{product.brand}</p>}

            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: 'Calories', value: product.calories, unit: 'kcal', color: 'text-orange-400' },
                { label: 'Protein', value: product.protein, unit: 'g', color: 'text-blue-400' },
                { label: 'Carbs', value: product.carbs, unit: 'g', color: 'text-yellow-400' },
                { label: 'Fat', value: product.fat, unit: 'g', color: 'text-red-400' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="bg-slate-700/50 rounded-xl p-2 text-center">
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-500">{unit}</p>
                  <p className="text-[10px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">Per {product.servingSize || '100g'}</p>
          </div>

          <button
            onClick={() => onFound(product)}
            className="btn-primary w-full"
          >
            Add to Meal
          </button>
          <button
            onClick={() => { setProduct(null); setManualCode(''); }}
            className="btn-secondary w-full"
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
}
