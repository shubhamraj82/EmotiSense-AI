import React from 'react';
import { Settings, Camera, Mic, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  permissions: { camera: boolean; mic: boolean };
  internetStatus: 'stable' | 'unstable' | 'checking';
  isCheckingInternet: boolean;
  checkInternet: () => void;
  requestPermissions: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const Step4TechnicalCheck: React.FC<Props> = ({ 
  permissions, 
  internetStatus, 
  isCheckingInternet, 
  checkInternet, 
  requestPermissions, 
  videoRef 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <Settings size={20} />
        </div>
        <h2 className="text-xl font-semibold">Technical Readiness Check</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className={permissions.camera ? "text-emerald-500" : "text-slate-400"} size={20} />
                <span className="text-sm font-medium">Camera Access</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${permissions.camera ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {permissions.camera ? "Allowed" : "Denied"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className={permissions.mic ? "text-emerald-500" : "text-slate-400"} size={20} />
                <span className="text-sm font-medium">Microphone Access</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${permissions.mic ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {permissions.mic ? "Allowed" : "Denied"}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className={internetStatus === 'stable' ? "text-emerald-500" : "text-amber-500"} size={20} />
                <span className="text-sm font-medium">Internet Connection</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isCheckingInternet ? "bg-blue-100 text-blue-700" : 
                internetStatus === 'stable' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {isCheckingInternet ? "Checking..." : internetStatus === 'stable' ? "Stable" : "Unstable"}
              </div>
            </div>
            <button 
              onClick={checkInternet}
              className="w-full text-xs text-indigo-600 font-semibold hover:underline"
            >
              Re-check connection
            </button>
          </div>
        </div>

        <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border-4 border-slate-100">
          {!permissions.camera ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Camera size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Camera preview will appear here once access is granted</p>
              <button 
                onClick={requestPermissions}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Grant Access
              </button>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}
          <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-[10px] text-white font-mono">
            LIVE PREVIEW
          </div>
        </div>
      </div>
    </motion.div>
  );
};
