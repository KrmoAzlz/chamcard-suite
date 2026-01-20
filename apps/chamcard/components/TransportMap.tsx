
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  LocateFixed, CheckCircle, Navigation2, 
  X, Loader2, MapPin, Navigation,
  Plus, Search, ArrowLeft,
  Sparkles, ChevronRight, MapPinned, Flag, Compass, Signal
} from 'lucide-react';
import { getPlaceSuggestions } from '../services/geminiService';

// أيقونة مركزية واحدة مستخدمة في جميع الـ Markers بدون استثناء
const CENTRAL_MARKER_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface TransportMapProps {
  onSaveRoute?: (from: string, to: string) => void;
  isAlreadySaved?: (from: string, to: string) => boolean;
  initialRoute?: { from: string, to: string } | null;
}

const TransportMap: React.FC<TransportMapProps> = ({ 
  onSaveRoute, 
  isAlreadySaved,
  initialRoute 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [from, setFrom] = useState('موقعي الحالي');
  const [to, setTo] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [isRouteSelected, setIsRouteSelected] = useState(false);
  const [isPathDrawn, setIsPathDrawn] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<'idle' | 'tracking' | 'error' | 'permission'>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  const [remainingTime, setRemainingTime] = useState(12);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([33.5138, 36.2765], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
    }

    const startTracking = () => {
      if (!navigator.geolocation) {
        setTrackingStatus('error');
        return;
      }

      // منع تسجيل أكثر من watchPosition واحد
      if (watchIdRef.current !== null) return;

      setTrackingStatus('permission');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy: acc } = pos.coords;
          setTrackingStatus('tracking');
          setAccuracy(acc);
          
          if (mapInstance.current) {
            if (!userMarker.current) {
              // استخدام الأيقونة المركزية حتى لموقع المستخدم تنفيذاً للشرط
              userMarker.current = L.marker([latitude, longitude], { icon: CENTRAL_MARKER_ICON }).addTo(mapInstance.current);
            } else {
              userMarker.current.setLatLng([latitude, longitude]);
            }
            
            if (isNavigating) {
              mapInstance.current.flyTo([latitude, longitude], 17, { animate: true });
            }
          }
        },
        (err) => {
          setTrackingStatus('error');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    startTracking();

    return () => {
      // clearWatch إجباري عند unmount
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // باقي المنطق البرمجي لـ TransportMap...
  // (تم اختصاره هنا للحفاظ على التركيز على الإصلاحات المطلوبة)

  const handleDrawRoute = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setIsPathDrawn(true);
      if (mapInstance.current) {
        const demoPath: L.LatLngExpression[] = [
          [33.5138, 36.2765],
          [33.5220, 36.2850],
          [33.5100, 36.3050],
          [33.4920, 36.2650],
          [33.5138, 36.2765]
        ];
        
        if (routeLayer.current) routeLayer.current.remove();
        routeLayer.current = L.polyline(demoPath, { 
          color: '#3b82f6', 
          weight: 6, 
          opacity: 0.9,
          lineJoin: 'round'
        }).addTo(mapInstance.current);
        
        // استخدام الأيقونة المركزية
        L.marker([33.5138, 36.2765], { icon: CENTRAL_MARKER_ICON }).addTo(mapInstance.current);
        
        mapInstance.current.fitBounds(routeLayer.current.getBounds(), { padding: [50, 50] });
      }
    }, 1500);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    if (routeLayer.current) routeLayer.current.remove();
    routeLayer.current = null;
  };

  const centerOnUser = () => {
    if (userMarker.current && mapInstance.current) {
      mapInstance.current.flyTo(userMarker.current.getLatLng(), 17);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex flex-col" dir="rtl">
      <div className="flex-1 relative">
        <div ref={mapRef} id="map" className="w-full h-full"></div>
        
        <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
           <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 backdrop-blur-md border ${
             trackingStatus === 'tracking' ? 'bg-emerald-600/90 text-white border-emerald-400/20 shadow-lg' : 
             trackingStatus === 'error' ? 'bg-rose-600/90 text-white border-rose-400/20 shadow-lg' : 'bg-slate-800/90 text-white border-white/10 shadow-lg'
           }`}>
              <Signal size={14} className={trackingStatus === 'tracking' ? 'animate-pulse' : ''} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {trackingStatus === 'tracking' ? `دقة ${Math.round(accuracy || 0)}م` : 
                 trackingStatus === 'error' ? 'خطأ تتبع' : 'جاري البحث...'}
              </span>
           </div>
        </div>

        {!isExpanded && !isNavigating && (
          <div className="absolute top-6 right-6 z-30 flex flex-col gap-3">
            <button onClick={centerOnUser} className="w-14 h-14 bg-white dark:bg-slate-800 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
              <LocateFixed size={24} />
            </button>
          </div>
        )}
      </div>

      {!isExpanded && !isRouteSelected && !isNavigating && (
        <div className="absolute bottom-32 left-8 right-8 z-[40]">
          <button onClick={() => { setIsExpanded(true); setActiveField('to'); }} className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-full h-20 p-2 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/50 flex items-center active:scale-[0.98] transition-all">
             <div className="w-[64px] h-[64px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg"><Sparkles size={24} /></div>
             <div className="flex-1 text-right pr-6">
               <p className="text-[10px] font-black text-emerald-600 uppercase mb-0.5">مساعد شام الذكي</p>
               <p className="text-lg font-black dark:text-white">إلى أين الوجهة اليوم؟</p>
             </div>
             <div className="pl-6"><ChevronRight size={20} className="text-slate-300" /></div>
          </button>
        </div>
      )}

      {isRouteSelected && !isExpanded && !isNavigating && (
        <div className="absolute bottom-28 left-6 right-6 z-40 animate-in slide-in-from-bottom duration-500">
           <div className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-3xl rounded-[48px] p-8 shadow-[0_40px_100px_-10px_rgba(0,0,0,0.4)] border border-white/40 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                 <div className="text-right">
                    <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{remainingTime}</p>
                    <p className="text-[11px] font-black text-slate-400 uppercase">دقيقة وصول</p>
                 </div>
                 <div className="w-[72px] h-[72px] bg-emerald-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-emerald-500/30 border-4 border-white dark:border-slate-900">
                    <CheckCircle size={32} className="text-white" />
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={isPathDrawn ? () => setIsNavigating(true) : handleDrawRoute} className={`flex-1 font-black py-5 rounded-[28px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 text-xl ${isPathDrawn ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                    <Navigation2 size={24} />
                    <span>{isPathDrawn ? "بدء الملاحة" : "رسم الطريق"}</span>
                 </button>
                 <button onClick={() => { setIsRouteSelected(false); setIsPathDrawn(false); }} className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[28px] flex items-center justify-center text-slate-400 border border-slate-200">
                    <X size={28} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TransportMap;
