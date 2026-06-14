import { useState, useEffect, useRef } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';
import { checkIn, getEventBookings, getMyEvents } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CAT_CONFIG = {
  Tech:     { color:'#00F2FE', emoji:'💻', img:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=70' },
  Music:    { color:'#9B51E0', emoji:'🎵', img:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=70' },
  Sports:   { color:'#05FF9B', emoji:'⚽', img:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=70' },
  Food:     { color:'#FFB300', emoji:'🍽️', img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=70' },
  Art:      { color:'#FF4081', emoji:'🎨', img:'https://images.unsplash.com/photo-1541367777708-7905fe3296c4?w=800&q=70' },
  Business: { color:'#4FC3F7', emoji:'💼', img:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=70' },
  Other:    { color:'var(--muted)', emoji:'⭐', img:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=70' },
};

function getSeatLabel(num, tiers) {
  if (!num || !tiers?.length) return String(num);
  const COLS = 30, ROWS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const order = ['VIP','Premium','Gold','Silver','General','Standard','Economy'];
  const sorted = [...tiers].sort((a,b)=>{
    const ai=order.findIndex(t=>a.name.toLowerCase().includes(t.toLowerCase()));
    const bi=order.findIndex(t=>b.name.toLowerCase().includes(t.toLowerCase()));
    return (ai===-1?99:ai)-(bi===-1?99:bi);
  });
  let g=0,ri=0;
  for(const tier of sorted){
    const rows=Math.ceil(tier.seats/COLS);
    for(let r=0;r<rows;r++){
      const rl=ROWS[ri%26];ri++;
      for(let c=0;c<COLS;c++){
        if(r*COLS+c>=tier.seats)break;
        g++;
        if(g===Number(num))return `${rl}-${String(c+1).padStart(2,'0')}`;
      }
    }
  }
  return String(num);
}
function getSeatLabels(nums, tiers) {
  return (nums||[]).map(n=>getSeatLabel(n,tiers)).join('  |  ');
}

/* ── Ticket Modal ────────────────────────────────────────────── */
function ScannedTicketModal({ booking, onClose }) {
  const cat = CAT_CONFIG[booking.event?.category] || CAT_CONFIG.Other;
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.92)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%',maxWidth:780 }}>
        <div style={{ textAlign:'center',marginBottom:16 }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:10,background:'rgba(5,255,155,0.1)',border:'1px solid rgba(5,255,155,0.3)',borderRadius:50,padding:'10px 24px' }}>
            <i className="bi bi-check-circle-fill" style={{ color:'#05FF9B',fontSize:22 }}/>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:16,color:'#05FF9B' }}>Check-In Successful!</span>
          </div>
        </div>
        <div style={{ display:'flex',borderRadius:20,overflow:'hidden',boxShadow:`0 32px 80px rgba(0,0,0,0.8),0 0 60px ${cat.color}30`,border:`1px solid ${cat.color}40` }}>
          <div style={{ flex:1,position:'relative',minHeight:280,overflow:'hidden' }}>
            <img src={cat.img} alt="" crossOrigin="anonymous" style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.3) saturate(1.2)' }}/>
            <div style={{ position:'absolute',inset:0,background:`linear-gradient(135deg,rgba(11,15,25,0.95),rgba(11,15,25,0.7))` }}/>
            <div style={{ position:'absolute',top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,${cat.color},#9B51E0,#05FF9B)` }}/>
            <div style={{ position:'relative',zIndex:2,padding:30,height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between' }}>
              <div>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                  <span style={{ fontSize:18 }}>{cat.emoji}</span>
                  <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:10,color:cat.color,letterSpacing:4,textTransform:'uppercase' }}>{booking.event?.category}</span>
                  <span style={{ padding:'2px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:'rgba(5,255,155,0.15)',color:'#05FF9B',border:'1px solid rgba(5,255,155,0.3)',marginLeft:'auto' }}>✓ CHECKED IN</span>
                </div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:24,color:'#fff',lineHeight:1.2,marginBottom:14 }}>{booking.event?.title}</div>
                <div style={{ background:`${cat.color}10`,border:`1px solid ${cat.color}30`,borderRadius:10,padding:'8px 14px',marginBottom:14,display:'inline-flex',alignItems:'center',gap:8 }}>
                  <i className="bi bi-person-fill" style={{ color:cat.color }}/>
                  <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:14,color:'#fff' }}>{booking.user?.name}</span>
                </div>
              </div>
              <div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
                  {[
                    {icon:'📅',label:'DATE',val:booking.event?.date?new Date(booking.event.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}):'-'},
                    {icon:'⏰',label:'TIME',val:booking.event?.time||'-'},
                    {icon:'📍',label:'VENUE',val:`${booking.event?.venue||''},${booking.event?.city||''}`},
                    {icon:'🪑',label:'SEATS',val:`${booking.seats} × ${booking.tier}`},
                    ...(booking.seatNumbers?.length?[{icon:'💺',label:'SEAT NO',val:getSeatLabels(booking.seatNumbers,booking.event?.tiers)}]:[]),
                  ].map((d,i)=>(
                    <div key={i}>
                      <div style={{ fontSize:8,fontWeight:700,color:`${cat.color}80`,letterSpacing:2,marginBottom:2,fontFamily:"'Space Grotesk',sans-serif" }}>{d.icon} {d.label}</div>
                      <div style={{ fontSize:12,fontWeight:600,color:'var(--text)' }}>{d.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'inline-flex',alignItems:'center',gap:12,background:`${cat.color}12`,border:`1.5px solid ${cat.color}40`,borderRadius:12,padding:'10px 18px' }}>
                  <span style={{ fontSize:8,fontWeight:700,color:`${cat.color}80`,letterSpacing:2 }}>BOOKING CODE</span>
                  <span style={{ fontFamily:'monospace',fontWeight:900,fontSize:18,color:cat.color,letterSpacing:3 }}>{booking.bookingCode}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ width:2,background:`repeating-linear-gradient(to bottom,${cat.color}50 0px,${cat.color}50 8px,transparent 8px,transparent 16px)`,flexShrink:0,position:'relative' }}>
            <div style={{ position:'absolute',top:-10,left:-9,width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,0.9)' }}/>
            <div style={{ position:'absolute',bottom:-10,left:-9,width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,0.9)' }}/>
          </div>
          <div style={{ width:200,flexShrink:0,background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:'24px 18px' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9,fontWeight:700,color:`${cat.color}80`,letterSpacing:2,fontFamily:"'Space Grotesk',sans-serif",marginBottom:3 }}>TOTAL PAID</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:24,color:'#fff' }}>{booking.totalAmount===0?'FREE':`₹${booking.totalAmount?.toLocaleString()}`}</div>
            </div>
            {booking.seatNumbers?.length>0&&(
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:9,fontWeight:700,color:`${cat.color}80`,letterSpacing:2,fontFamily:"'Space Grotesk',sans-serif",marginBottom:3 }}>SEAT NO</div>
                <div style={{ fontFamily:'monospace',fontWeight:900,fontSize:16,color:cat.color,letterSpacing:2 }}>{getSeatLabels(booking.seatNumbers,booking.event?.tiers)}</div>
              </div>
            )}
            {booking.qrData&&(
              <div style={{ background:'#fff',borderRadius:10,padding:8,boxShadow:`0 0 20px ${cat.color}30` }}>
                <img src={booking.qrData} alt="QR" style={{ width:120,height:120,display:'block' }}/>
              </div>
            )}
            <div style={{ fontSize:9,fontWeight:700,color:`${cat.color}60`,letterSpacing:3,fontFamily:"'Space Grotesk',sans-serif",textAlign:'center' }}>ADMIT {booking.seats>1?booking.seats:'ONE'}</div>
            <div style={{ fontSize:9,color:'rgba(255,255,255,0.15)',fontFamily:"'Space Grotesk',sans-serif",fontWeight:700 }}>⬡ EVENTSPHERE</div>
          </div>
        </div>
        <div style={{ textAlign:'center',marginTop:16 }}>
          <button onClick={onClose} style={{ padding:'10px 32px',borderRadius:12,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:13,background:'rgba(255,255,255,0.06)',color:'#fff',border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer' }}>
            Close & Scan Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Webcam QR Scanner ───────────────────────────────────────── */
function WebcamScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef   = useRef(null);
  const [status, setStatus] = useState('Starting camera...');
  const [error, setError]   = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.onloadedmetadata = () => {
          setStatus('Point camera at QR code');
          scanFrame();
        };
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permission and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const scanFrame = async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Dynamically import jsQR
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        setStatus('QR detected! Checking in...');
        stopCamera();
        // Parse booking code from QR data
        let bookingCode = code.data;
        try {
          const parsed = JSON.parse(code.data);
          bookingCode = parsed.code || code.data;
        } catch {}
        onScan(bookingCode);
        return;
      }
    } catch {}

    animRef.current = requestAnimationFrame(scanFrame);
  };

  return (
    <div style={{ position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:20,padding:20 }}>
      <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'1.2rem',color:'var(--mint)',textAlign:'center' }}>
        <i className="bi bi-camera-video me-2"/>Live QR Scanner
      </div>

      {error ? (
        <div style={{ background:'rgba(255,64,129,0.1)',border:'1px solid rgba(255,64,129,0.3)',borderRadius:16,padding:24,maxWidth:360,textAlign:'center' }}>
          <i className="bi bi-camera-video-off" style={{ fontSize:48,color:'var(--pink)',display:'block',marginBottom:12 }}/>
          <p style={{ color:'var(--pink)',fontSize:14,fontWeight:700,marginBottom:8 }}>{error}</p>
          <p style={{ color:'var(--muted)',fontSize:12 }}>Use manual code entry below instead</p>
        </div>
      ) : (
        <div style={{ position:'relative',width:320,height:320,borderRadius:20,overflow:'hidden',border:'2px solid var(--mint)',boxShadow:'0 0 40px rgba(5,255,155,0.3)' }}>
          <video ref={videoRef} style={{ width:'100%',height:'100%',objectFit:'cover' }} muted playsInline/>
          <canvas ref={canvasRef} style={{ display:'none' }}/>
          {/* Scanning corners */}
          {['tl','tr','bl','br'].map(c=>(
            <div key={c} style={{
              position:'absolute', width:30, height:30,
              top: c.includes('t') ? 10 : 'auto', bottom: c.includes('b') ? 10 : 'auto',
              left: c.includes('l') ? 10 : 'auto', right: c.includes('r') ? 10 : 'auto',
              borderTop: c.includes('t') ? '3px solid #05FF9B' : 'none',
              borderBottom: c.includes('b') ? '3px solid #05FF9B' : 'none',
              borderLeft: c.includes('l') ? '3px solid #05FF9B' : 'none',
              borderRight: c.includes('r') ? '3px solid #05FF9B' : 'none',
              borderRadius: c==='tl'?'6px 0 0 0':c==='tr'?'0 6px 0 0':c==='bl'?'0 0 0 6px':'0 0 6px 0',
            }}/>
          ))}
          {/* Scan line */}
          <div style={{ position:'absolute',left:10,right:10,height:2,background:'linear-gradient(90deg,transparent,#05FF9B,transparent)',animation:'scan 2s ease-in-out infinite',boxShadow:'0 0 10px #05FF9B' }}/>
          {/* Status */}
          <div style={{ position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.7)',padding:'10px',textAlign:'center',fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,color:'var(--mint)' }}>
            {status}
          </div>
        </div>
      )}

      <button onClick={onClose} style={{ padding:'10px 28px',borderRadius:12,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:13,background:'rgba(255,255,255,0.06)',color:'#fff',border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer' }}>
        <i className="bi bi-x-lg me-2"/>Close Camera
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function ScanQR() {
  const [code, setCode]             = useState('');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [scanning, setScanning]     = useState(false);
  const [history, setHistory]       = useState([]);
  const [recentCodes, setRecentCodes] = useState([]);
  const [scannedBooking, setScannedBooking] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (!user || user.role === 'attendee') { navigate('/'); return; }
    loadRecentCodes();
  }, []);

  const loadRecentCodes = async () => {
    try {
      const { data: events } = await getMyEvents();
      if (events?.length > 0) {
        const { data: bookings } = await getEventBookings(events[0]._id);
        setRecentCodes(bookings?.slice(0,6).map(b => b.bookingCode) || []);
      }
    } catch {}
  };

  const handleCheckIn = async (checkCode) => {
    const c = (checkCode || code).trim().toUpperCase();
    if (!c) { setResult({ error: 'Please enter a booking code' }); return; }
    setLoading(true); setScanning(true); setCameraOpen(false);
    await new Promise(r => setTimeout(r, 600));
    try {
      const { data } = await checkIn(c);
      setResult({ success: true });
      setScannedBooking(data.booking);
      setHistory(h => [{
        code: c, name: data.booking?.user?.name || 'Attendee',
        event: data.booking?.event?.title || '',
        time: new Date().toLocaleTimeString(), success: true,
        fullBooking: data.booking,
      }, ...h.slice(0,19)]);
      setCode('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid booking code';
      const alreadyIn = msg.toLowerCase().includes('already');
      setResult({ error: msg, alreadyIn });
      if (alreadyIn && err.response?.data?.booking) setScannedBooking(err.response.data.booking);
      setHistory(h => [{
        code:c, name: err.response?.data?.booking?.user?.name||'—',
        event: err.response?.data?.booking?.event?.title||'',
        time: new Date().toLocaleTimeString(), success: false,
        fullBooking: err.response?.data?.booking,
      }, ...h.slice(0,19)]);
    } finally {
      setLoading(false);
      setTimeout(() => setScanning(false), 1200);
    }
  };

  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 66px)', flexDirection:'row' }}>

      {/* Webcam modal */}
      {cameraOpen && <WebcamScanner onScan={handleCheckIn} onClose={() => setCameraOpen(false)} />}

      {/* Ticket modal */}
      {scannedBooking && (
        <ScannedTicketModal booking={scannedBooking} onClose={() => { setScannedBooking(null); setResult(null); }} />
      )}

      {/* Sidebar */}
      <div className="sidebar hidden md:block">
        <div className="sbl" onClick={() => navigate('/org-dashboard')}><i className="bi bi-arrow-left"/>Back</div>
        <div className="sbl active"><i className="bi bi-qr-code-scan"/>QR Check-in</div>
        <div className="sbl" onClick={() => navigate('/create-event')}><i className="bi bi-plus-circle"/>New Event</div>
      </div>

      <div className="fade-up" style={{ flex:1, padding: isMobile ? '14px' : '24px', minWidth:0 }}>
        <div className="pgh" style={{ marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:'1.2rem',marginBottom:4,color:'var(--heading)',display:'flex',alignItems:'center',gap:10 }}>
            <i className="bi bi-qr-code-scan" style={{ color:'var(--mint)' }}/>QR Check-in Terminal
          </h2>
          <p style={{ color:'var(--muted)',fontSize:13 }}>Scan with camera or enter booking code manually</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 20 }}>

          {/* Scanner panel */}
          <div style={{ background:'var(--card-bg)',border:'1px solid rgba(5,255,155,0.2)',borderRadius:20,padding:24 }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:13,color:'var(--mint)',marginBottom:18,display:'flex',alignItems:'center',gap:8 }}>
              <i className="bi bi-camera-video"/>Scanner
            </div>

            {/* Camera scan button — prominent */}
            <button onClick={() => setCameraOpen(true)}
              style={{ width:'100%',padding:'16px',borderRadius:16,marginBottom:20,fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:15,color:'#000',border:'none',cursor:'pointer',background:'linear-gradient(135deg,#05FF9B,#00F2FE)',boxShadow:'0 6px 24px rgba(5,255,155,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
              <i className="bi bi-camera-video-fill" style={{ fontSize:20 }}/>
              Scan with Camera
            </button>

            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
              <div style={{ flex:1,height:1,background:'var(--border)' }}/>
              <span style={{ fontSize:11,color:'var(--muted)',fontFamily:"'Space Grotesk',sans-serif",fontWeight:700 }}>OR ENTER CODE</span>
              <div style={{ flex:1,height:1,background:'var(--border)' }}/>
            </div>

            {/* Manual input */}
            <div style={{ marginBottom:12 }}>
              <label className="fl">Booking Code</label>
              <div style={{ display:'flex',gap:8 }}>
                <input className="fi"
                  placeholder="ES-XXXXXXXX"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key==='Enter' && handleCheckIn()}
                  style={{ flex:1,fontFamily:'monospace',letterSpacing:2,fontSize:15 }}
                />
                <button onClick={() => handleCheckIn()} disabled={loading}
                  style={{ width:44,height:44,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--mint)',color:'#000',border:'none',cursor:'pointer',flexShrink:0,fontSize:18,fontWeight:900 }}>
                  {loading
                    ? <i className="bi bi-arrow-repeat" style={{ animation:'spin 0.7s linear infinite',display:'inline-block' }}/>
                    : <i className="bi bi-check2"/>}
                </button>
              </div>
            </div>

            <button onClick={() => handleCheckIn()} disabled={loading}
              style={{ width:'100%',padding:'12px',borderRadius:12,fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:13,color:'#000',border:'none',cursor:'pointer',background:'linear-gradient(135deg,#05FF9B,#00F2FE)',marginBottom:16 }}>
              {loading ? 'Checking in...' : <><i className="bi bi-check-circle me-2"/>Check In</>}
            </button>

            {/* Recent codes */}
            {recentCodes.length > 0 && (
              <div>
                <p style={{ fontSize:10,color:'var(--muted)',fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,letterSpacing:1,marginBottom:6 }}>RECENT BOOKINGS</p>
                <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                  {recentCodes.map(rc => (
                    <button key={rc} onClick={() => setCode(rc)}
                      style={{ padding:'4px 10px',borderRadius:8,fontSize:11,fontFamily:'monospace',background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--cyan)',cursor:'pointer',letterSpacing:1 }}>
                      {rc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error result */}
            {result && !result.success && !scannedBooking && (
              <div className="fade-up" style={{ marginTop:14,borderRadius:12,padding:14,background:result.alreadyIn?'rgba(255,179,0,0.07)':'rgba(255,64,129,0.07)',border:`1px solid ${result.alreadyIn?'rgba(255,179,0,0.25)':'rgba(255,64,129,0.25)'}` }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <i className={`bi ${result.alreadyIn?'bi-info-circle-fill':'bi-x-circle-fill'}`} style={{ color:result.alreadyIn?'var(--amber)':'var(--pink)',fontSize:18 }}/>
                  <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:13,color:result.alreadyIn?'var(--amber)':'var(--pink)' }}>{result.error}</span>
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <div style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden' }}>
            <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:13,color:'var(--cyan)',display:'flex',alignItems:'center',gap:8 }}>
                <i className="bi bi-clock-history"/>Recent Check-ins
              </span>
              <div style={{ display:'flex',gap:12 }}>
                <span style={{ fontSize:11,color:'var(--mint)',fontWeight:700 }}>{history.filter(h=>h.success).length} ✓</span>
                <span style={{ fontSize:11,color:'var(--pink)',fontWeight:700 }}>{history.filter(h=>!h.success).length} ✗</span>
              </div>
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign:'center',padding:'48px 24px' }}>
                <i className="bi bi-camera-video" style={{ fontSize:40,color:'var(--muted)',display:'block',marginBottom:12 }}/>
                <p style={{ color:'var(--muted)',fontSize:13 }}>No check-ins yet</p>
                <p style={{ color:'var(--muted)',fontSize:11,marginTop:4 }}>Use camera or enter code above</p>
              </div>
            ) : (
              <div style={{ maxHeight:480,overflowY:'auto' }}>
                {history.map((h,i) => (
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:'1px solid var(--border)',cursor:h.fullBooking?'pointer':'default' }}
                    onClick={() => h.fullBooking && setScannedBooking(h.fullBooking)}>
                    <div style={{ width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:h.success?'rgba(5,255,155,0.1)':'rgba(255,64,129,0.1)' }}>
                      <i className={`bi ${h.success?'bi-check-lg':'bi-x-lg'}`} style={{ color:h.success?'var(--mint)':'var(--pink)',fontWeight:900 }}/>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,color:'var(--cyan)',letterSpacing:1 }}>{h.code}</div>
                      <div style={{ fontSize:11,color:'var(--text)',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{h.name}{h.event?` · ${h.event}`:''}</div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ fontSize:10,color:'var(--muted)' }}>{h.time}</div>
                      {h.fullBooking && <div style={{ fontSize:9,color:'var(--cyan)',marginTop:2 }}>click to view</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}