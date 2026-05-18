import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import { 
    X, Camera, Image as ImageIcon, Loader2, CheckCircle2, 
    ScanLine, ReceiptText, AlertCircle, Save, TrendingUp,
    Zap, Pill, ShoppingCart, Fuel, Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ReceiptScannerModal = ({ isOpen, onClose, onRefresh }) => {
    const [image, setImage] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [progress, setProgress] = useState(0);
    const canvasRef = useRef(null);

    const [editForm, setEditForm] = useState({
        merchant_name: '',
        amount: '',
        category: 'Shopping',
        transaction_date: new Date().toISOString().split('T')[0],
        ocr_text: '',
        items: []
    });

    const preprocessImage = (imageSrc) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    const contrast = 1.2; 
                    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                    const newValue = factor * (avg - 128) + 128;
                    data[i] = newValue; data[i + 1] = newValue; data[i + 2] = newValue;
                }
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
        });
    };

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                setImage(reader.result);
                const enhancedImage = await preprocessImage(reader.result);
                performOCR(enhancedImage);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, accept: {'image/*': []}, multiple: false 
    });

    const performOCR = async (imageSource) => {
        setScanning(true);
        setScanResult(null);
        setProgress(0);

        try {
            const { data: { text } } = await Tesseract.recognize(imageSource, 'eng', {
                logger: m => { if (m.status === 'recognizing text') setProgress(m.progress * 100); }
            });

            // Intelligence Phase
            const lines = text.split('\n');
            const textLower = text.toLowerCase();
            let detectedMerchant = lines[0]?.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Retail Hub';
            let category = 'Shopping';
            let extractedAmount = '';
            let items = [];

            // 1. Sector Logic (Focussed on Pharmacy/Health)
            if (/(tablet|capsule|syrup|medical|pharmacy|hospital|druggist|rx|pill|health|chem)/i.test(textLower)) {
                category = 'Health';
                detectedMerchant = lines.find(l => /medical|pharma|health|chemist/i.test(l)) || detectedMerchant;
            } else if (/(petrol|fuel|speed|gas station|diesel|shell|hpc|bpcl)/i.test(textLower)) {
                category = 'Transport';
            } else if (/(restaurant|cafe|food|biryani|dining|pizza|mcdonald|burger|kitchen)/i.test(textLower)) {
                category = 'Food';
            }

            // 2. High-Fidelity Amount Extraction (NEW & ROBUST)
            const totalPatterns = [
                /(?:total\s*amount|grand\s*total|net\s*payable|final\s*amount|total|payable|net\s*amount|gross\s*amount)[:\s]*[₹$£]?\s*(\d+(?:[.,]\d{2,3})?)/i,
                /(?:amount|total)[:\s]*[₹$£]?\s*(\d+(?:[.,]\d{2,3})?)/i,
                /(\d+(?:[.,]\d{2,3})?)\s*(?:total|amount|payable)/i
            ];

            // Scan lines from bottom to top for "Total" proximity
            const reversedLines = [...lines].reverse();
            for (let line of reversedLines) {
                if (/(total|grand|payable|net|final|gross|total\s*amount)/i.test(line)) {
                    const match = line.match(/(\d+(?:[.,]\d{2,3})?)/);
                    if (match) {
                        extractedAmount = match[1];
                        break;
                    }
                }
            }

            // Fallback: Max Value Intelligence (ignore dates/IDs)
            if (!extractedAmount) {
                const allMonetaryValues = text.match(/\b\d+[.,]\d{2}\b/g) || [];
                if (allMonetaryValues.length > 0) {
                    const numericValues = allMonetaryValues.map(v => parseFloat(v.replace(',', ''))).filter(v => v < 100000);
                    if (numericValues.length > 0) extractedAmount = Math.max(...numericValues).toString();
                }
            }

            // 3. Item Extraction
            lines.forEach(line => {
                const medMatch = line.match(/(.*(?:tablet|capsule|mg|mcg|ml|syr|syp|'s)).*?(?:qty|x|@)\s?(\d+)/i);
                if (medMatch) items.push({ name: medMatch[1].trim(), qty: medMatch[2], amount: 'Verified' });
                const itemMatch = line.match(/(.*?)\s+(?:qty|x|@)\s?(\d+)\s+(?:rs|₹|amt)?\s?(\d+(?:[.,]\d{2,3})?)/i);
                if (itemMatch) items.push({ name: itemMatch[1].trim(), qty: itemMatch[2], amount: itemMatch[3] });
            });

            setEditForm({
                merchant_name: detectedMerchant.trim(),
                amount: extractedAmount.replace(',', '.'),
                category: category,
                transaction_date: new Date().toISOString().split('T')[0],
                ocr_text: text,
                items: items
            });
            setScanResult(true);
        } catch (err) {
            console.error("Neural Failure:", err);
            alert("Scanner Matrix Error.");
        } finally {
            setScanning(false);
        }
    };

    const handleConfirm = async () => {
        try {
            const token = localStorage.getItem('token');
            const blob = await fetch(image).then(res => res.blob());
            const uploadFormData = new FormData();
            uploadFormData.append('file', blob, 'receipt.png');
            const uploadRes = await axios.post('http://localhost:8000/receipts/upload', uploadFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const confirmFormData = new FormData();
            confirmFormData.append('scan_id', uploadRes.data.scan_id);
            confirmFormData.append('merchant_name', editForm.merchant_name);
            confirmFormData.append('amount', editForm.amount);
            confirmFormData.append('category', editForm.category);
            confirmFormData.append('transaction_date', new Date().toISOString());
            confirmFormData.append('ocr_text', editForm.ocr_text);

            await axios.post('http://localhost:8000/receipts/confirm', confirmFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Capital Volume Synchronized!");
            onRefresh(); onClose(); 
            setImage(null); setScanResult(null);
        } catch (err) { alert("Authorization Blocked."); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-3xl" />
            <canvas ref={canvasRef} className="hidden" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} 
                className="glass p-12 rounded-[4rem] w-full max-w-5xl relative z-10 border-primary/20 shadow-2xl overflow-hidden"
            >
                <button onClick={onClose} className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-all"><X size={32} /></button>
                <div className="flex gap-12">
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <Zap className="text-primary animate-pulse" size={32} />
                            <div>
                                <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white">Neural Hub Scan</h3>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Automatic Value Extraction Active</p>
                            </div>
                        </div>

                        {!image ? (
                            <div {...getRootProps()} className="h-[500px] border-2 border-dashed rounded-[3.5rem] flex flex-col items-center justify-center gap-8 cursor-pointer border-white/10 hover:border-primary/40 hover:bg-white/5">
                                <input {...getInputProps()} />
                                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40"><Camera className="text-primary" size={40} /></div>
                                <p className="text-lg font-black uppercase tracking-widest text-white italic">Drop Financial Vector</p>
                            </div>
                        ) : (
                            <div className="relative rounded-[3.5rem] overflow-hidden group border border-white/10">
                                <img src={image} className="w-full h-[500px] object-contain bg-black/60" alt="Scanning..." />
                                {scanning && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-8">
                                        <Loader2 className="animate-spin text-primary" size={64} />
                                        <div className="w-[80%] space-y-4">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs font-black italic text-primary uppercase tracking-widest animate-pulse">Scanning Final Settlement Value...</span>
                                                <span className="text-xs font-black text-white">{Math.round(progress)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                                                <motion.div animate={{ width: `${progress}%` }} className="h-full bg-primary rounded-full shadow-[0_0_30px_rgba(59,130,246,0.8)]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="w-[420px] space-y-8 flex flex-col justify-start pt-10">
                        {!scanResult && !scanning ? (
                            <div className="glass p-12 rounded-[3.5rem] border-white/5 text-center opacity-40 italic h-full flex flex-col items-center justify-center gap-6">
                                <ReceiptText size={80} className="text-zinc-700" />
                                <p className="text-[11px] font-black uppercase tracking-[0.4em]">Listening for Data...</p>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="p-8 rounded-[2.5rem] bg-primary/10 border border-primary/30 flex items-center gap-6">
                                    <div className="p-3 rounded-xl bg-primary/20">
                                        {editForm.category === 'Health' ? <Pill className="text-primary" /> : <ShoppingCart className="text-primary" />}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Sector Decision</span>
                                        <p className="text-lg font-black text-white uppercase">{editForm.category} Detected</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-3">Merchant Vector</label>
                                        <input type="text" className="w-full glass p-6 rounded-3xl text-white outline-none focus:border-primary/50 text-base font-black italic tracking-tighter" value={editForm.merchant_name} onChange={e => setEditForm({...editForm, merchant_name: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary ml-3 animate-pulse">Capital Volume (Auto-Filled)</label>
                                        <input type="text" className="w-full glass p-6 rounded-3xl text-primary border-primary/40 outline-none focus:border-primary text-3xl font-black italic tracking-tighter shadow-[0_0_20px_rgba(59,130,246,0.1)]" placeholder="0.00" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
                                    </div>
                                    
                                    {editForm.items.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-3">Line Intelligence</label>
                                            <div className="max-h-20 overflow-y-auto space-y-2 pr-2">
                                                {editForm.items.map((item, id) => (
                                                    <div key={id} className="text-[9px] font-black text-zinc-500 uppercase italic flex justify-between">
                                                        <span>{item.name} x{item.qty}</span>
                                                        <span>{item.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-zinc-600 ml-3">Temporal</label>
                                            <input type="date" className="w-full glass p-6 rounded-3xl text-white outline-none text-[10px] font-black uppercase tracking-widest" value={editForm.transaction_date} onChange={e => setEditForm({...editForm, transaction_date: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-zinc-600 ml-3">Matrix</label>
                                            <select className="w-full glass p-6 rounded-3xl text-white outline-none text-[10px] font-black uppercase tracking-widest" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                                                {['Health', 'Food', 'Transport', 'Shopping', 'Subscription'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleConfirm} className="w-full py-8 mt-4 bg-primary text-white rounded-[3rem] font-black uppercase tracking-[0.4em] italic shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-4">
                                    <Save size={24} /> AUTHORIZE LEDGER ENTRY
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const Trash2 = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;

export default ReceiptScannerModal;
