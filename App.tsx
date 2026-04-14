/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MapPin, User, Navigation, Volume2, VolumeX, AlertCircle, CheckCircle2, LogIn, UserPlus } from 'lucide-react';
import { speak, startListening } from './lib/voice';
import { parseVoiceCommand } from './lib/gemini';

type AppState = 'HOME' | 'LOCATION' | 'NAVIGATING' | 'LOGIN' | 'SIGNUP';

export default function App() {
  const [state, setState] = useState<AppState>('HOME');
  const [isListening, setIsListening] = useState(false);
  const [lastResponse, setLastResponse] = useState("Welcome to Visionary Voice. Tap anywhere to speak a command.");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Initial greeting
  useEffect(() => {
    if (!isMuted) {
      speak(lastResponse);
    }
  }, []);

  const handleVoiceCommand = async (text: string) => {
    setLastResponse(`I heard: "${text}". Processing...`);
    const result = await parseVoiceCommand(text);
    
    setLastResponse(result.response);
    if (!isMuted) speak(result.response);

    switch (result.action) {
      case 'LOCATION':
        setState('LOCATION');
        fetchLocation();
        break;
      case 'NAVIGATE':
        setState('NAVIGATING');
        break;
      case 'LOGIN':
        setState('LOGIN');
        break;
      case 'SIGNUP':
        setState('SIGNUP');
        break;
      default:
        // Stay on current state or handle unknown
        break;
    }
  };

  const toggleListening = () => {
    if (isListening) return;
    
    setIsListening(true);
    startListening(
      (text) => {
        setIsListening(false);
        handleVoiceCommand(text);
      },
      (err) => {
        setIsListening(false);
        const errMsg = "Sorry, I couldn't hear you. Please try again.";
        setLastResponse(errMsg);
        if (!isMuted) speak(errMsg);
        console.error(err);
      }
    );
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported by your device.";
      setLastResponse(msg);
      if (!isMuted) speak(msg);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        // In a real app, we'd reverse geocode here. For now, mock it.
        setAddress("123 Accessibility Lane, Tech City");
        const msg = `You are currently at 123 Accessibility Lane.`;
        setLastResponse(msg);
        if (!isMuted) speak(msg);
      },
      (err) => {
        const msg = "Unable to retrieve your location.";
        setLastResponse(msg);
        if (!isMuted) speak(msg);
      }
    );
  };

  const renderContent = () => {
    switch (state) {
      case 'LOCATION':
        return (
          <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
            <div className="p-8 bg-blue-600 rounded-full shadow-2xl">
              <MapPin size={80} className="text-white" />
            </div>
            <div className="text-center px-6">
              <h2 className="text-4xl font-bold mb-4">Current Location</h2>
              <p className="text-2xl text-gray-300">{address || "Locating..."}</p>
              {location && (
                <p className="text-sm text-gray-500 mt-2 font-mono">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
            </div>
            <button 
              onClick={() => setState('HOME')}
              className="mt-8 px-12 py-6 bg-white text-black text-2xl font-bold rounded-2xl active:scale-95 transition-transform"
            >
              Back to Home
            </button>
          </div>
        );
      case 'NAVIGATING':
        return (
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="p-8 bg-green-600 rounded-full animate-pulse">
              <Navigation size={80} className="text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-bold">Navigating</h2>
              <p className="text-2xl text-gray-300 mt-4">Walk straight for 50 meters, then turn left.</p>
            </div>
            <button 
              onClick={() => setState('HOME')}
              className="mt-8 px-12 py-6 bg-red-600 text-white text-2xl font-bold rounded-2xl"
            >
              Stop Navigation
            </button>
          </div>
        );
      case 'LOGIN':
      case 'SIGNUP':
        return (
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="p-8 bg-purple-600 rounded-full">
              {state === 'LOGIN' ? <LogIn size={80} className="text-white" /> : <UserPlus size={80} className="text-white" />}
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-bold">{state === 'LOGIN' ? 'Voice Login' : 'Voice Sign Up'}</h2>
              <p className="text-2xl text-gray-300 mt-4">Please say your username and password when prompted.</p>
            </div>
            <button 
              onClick={() => setState('HOME')}
              className="mt-8 px-12 py-6 bg-white text-black text-2xl font-bold rounded-2xl"
            >
              Cancel
            </button>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 gap-6 w-full max-w-md px-6">
            <MenuButton 
              icon={<MapPin size={40} />} 
              label="Where am I?" 
              color="bg-blue-600" 
              onClick={() => handleVoiceCommand("Where am I?")}
            />
            <MenuButton 
              icon={<Navigation size={40} />} 
              label="Navigate" 
              color="bg-green-600" 
              onClick={() => handleVoiceCommand("Take me to the park")}
            />
            <MenuButton 
              icon={<User size={40} />} 
              label="Account" 
              color="bg-purple-600" 
              onClick={() => handleVoiceCommand("Go to login")}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          VISIONARY VOICE
        </h1>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </header>

      {/* Main Interaction Area */}
      <main 
        className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden"
        onClick={toggleListening}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex flex-col items-center"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {/* Feedback Area */}
        <div className="absolute bottom-32 left-0 right-0 px-8 text-center pointer-events-none">
          <p className={`text-xl font-medium transition-all duration-300 ${isListening ? 'text-blue-400 scale-110' : 'text-gray-400'}`}>
            {lastResponse}
          </p>
        </div>

        {/* Voice Trigger Button (Floating) */}
        <div className="absolute bottom-12 flex flex-col items-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-all duration-500 ${isListening ? 'bg-red-600 scale-110' : 'bg-blue-600'}`}
          >
            {isListening ? (
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [10, 30, 10] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                    className="w-1.5 bg-white rounded-full"
                  />
                ))}
              </div>
            ) : (
              <Mic size={40} className="text-white" />
            )}
          </motion.button>
          <p className="mt-4 text-sm uppercase tracking-widest font-bold text-gray-500">
            {isListening ? "Listening..." : "Tap to Speak"}
          </p>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="p-4 bg-white/5 border-t border-white/10 flex justify-center gap-6 text-xs font-mono text-gray-500">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-green-500" /> SYSTEM READY
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle size={12} className="text-blue-500" /> GPS ACTIVE
        </span>
      </footer>
    </div>
  );
}

function MenuButton({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Don't trigger the main listener
        onClick();
      }}
      className={`flex items-center gap-6 p-8 ${color} rounded-3xl shadow-xl active:scale-95 transition-all w-full text-left`}
    >
      <div className="bg-white/20 p-4 rounded-2xl">
        {icon}
      </div>
      <span className="text-3xl font-bold tracking-tight">{label}</span>
    </button>
  );
}

