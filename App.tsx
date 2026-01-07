
import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 🌿 CONFIGURATION
 * A fully editable, intimate, and pinkish space for gratitude.
 */
const DEFAULT_CONFIG = {
  audio: {
    slideSound: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    bgMusic: "https://cdn.pixabay.com/audio/2022/05/27/audio_180873747b.mp3"
  },
  messages: {
    intro: {
      heading: "I wanted to say a few things.",
      subtext: "So I made this."
    },
    appreciation: {
      p1: "In a world that often feels too loud and too fast, you have this rare gift of making life feel quiet, meaningful, and soft.",
      p2: "I built this space specifically for you. Not because I had to, but because I wanted you to have a small, permanent reminder of how much your presence matters."
    },
    galleryTitle: "Gathered Moments",
    videoTitle: "Living Fragments",
    thoughts: [
      "Some people make things lighter.",
      "You’re definitely one of them."
    ],
    hidden: {
      prompt: "One more thing...",
      message: "You are more than the sum of your days. You are a light that matters to the people lucky enough to see it.",
      final: "— You are enough."
    },
    closing: {
      line1: "This isn’t everything.",
      line2: "It’s just something I wanted you to have."
    }
  },
  photos: [
    { url: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=800&auto=format&fit=crop", label: "A quiet morning" },
    { url: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop", label: "Soft light" },
    { url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop", label: "Shared laughter" }
  ],
  videos: [
    { url: "https://assets.mixkit.co/videos/preview/mixkit-sun-shining-through-tree-leaves-2311-large.mp4", title: "Peaceful trees" }
  ]
};

// --- Helper Components ---

const FloatingElements: React.FC = () => {
  const elements = Array.from({ length: 25 });
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((_, i) => {
        const type = i % 4;
        const size = Math.random() * 12 + 10;
        return (
          <div
            key={i}
            className="absolute animate-drift opacity-[0.25]"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-120px`,
              animationDuration: `${Math.random() * 40 + 50}s`,
              animationDelay: `${Math.random() * -80}s`,
            }}
          >
            {type === 0 && <span className="text-softPink" style={{ fontSize: size }}>♥</span>}
            {type === 1 && <span className="text-warmRose" style={{ fontSize: size }}>✧</span>}
            {type === 2 && <span className="text-mutedPink" style={{ fontSize: size }}>✿</span>}
            {type === 3 && <div className="rounded-full bg-softPink/15 shadow-[0_0_10px_rgba(255,183,197,0.3)]" style={{ width: size, height: size }} />}
          </div>
        );
      })}
    </div>
  );
};

const MusicVisualizer: React.FC<{ isPlaying: boolean; isMuted: boolean }> = ({ isPlaying, isMuted }) => (
  <div className={`flex items-end gap-1.5 h-4 transition-opacity duration-700 ${!isPlaying || isMuted ? 'opacity-20' : 'opacity-90'}`}>
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="w-1.5 bg-softPink rounded-full animate-music-bar shadow-[0_0_6px_rgba(255,183,197,0.6)]"
        style={{ animationDelay: `${i * 0.2}s`, animationPlayState: isPlaying && !isMuted ? 'running' : 'paused' }}
      />
    ))}
  </div>
);

const VideoItem: React.FC<{ vid: any }> = ({ vid }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Playback failed", e));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div 
      onClick={togglePlay}
      className="w-full max-w-4xl mx-auto aspect-video rounded-[3rem] shadow-2xl overflow-hidden bg-ivory/20 border-[8px] border-white group relative card-hover-effect cursor-pointer"
    >
      <video 
        ref={videoRef}
        src={vid.url} 
        className="w-full h-full object-cover" 
        loop 
        muted 
        playsInline 
      />
      <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-all duration-700 ${isPlaying ? 'opacity-0 scale-110' : 'opacity-100 scale-100 group-hover:bg-black/20'}`}>
         <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-2xl flex items-center justify-center text-white text-2xl shadow-2xl border border-white/40 group-hover:scale-110 transition-transform">
           {isPlaying ? '⏸' : '▶'}
         </div>
      </div>
      <div className="absolute bottom-8 left-8 text-white font-serif italic text-lg bg-black/30 backdrop-blur-md px-8 py-3 rounded-full border border-white/20 tracking-wide">
        {vid.title}
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('quiet_gratitude_final_v8');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const transitionAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const totalSlides = 7;

  useEffect(() => {
    try {
      localStorage.setItem('quiet_gratitude_final_v8', JSON.stringify(config));
    } catch (e) {
      console.warn("Storage limit reached.");
    }
  }, [config]);

  const playSlideSound = useCallback(() => {
    if (transitionAudioRef.current && !isMuted) {
      transitionAudioRef.current.currentTime = 0;
      transitionAudioRef.current.play().catch(() => {});
    }
  }, [isMuted]);

  const startExperience = () => {
    setHasStarted(true);
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = 0.35;
      bgMusicRef.current.play().catch(() => {});
    }
  };

  const handleNext = useCallback(() => {
    if (currentSlide < totalSlides - 1 && !isTransitioning) {
      playSlideSound();
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(prev => prev + 1);
        setIsTransitioning(false);
      }, 600);
    }
  }, [currentSlide, isTransitioning, playSlideSound]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0 && !isTransitioning) {
      playSlideSound();
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(prev => prev - 1);
        setIsTransitioning(false);
      }, 600);
    }
  }, [currentSlide, isTransitioning, playSlideSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (!hasStarted) return;
      
      const key = e.key;
      if (key === 'ArrowRight' || key === ' ' || key === 'Enter') {
        if (key === ' ') e.preventDefault();
        handleNext();
      } else if (key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, handleNext, handlePrev]);

  const triggerHeartBurst = (e: React.MouseEvent) => {
    if (showHidden) return;
    const x = e.clientX;
    const y = e.clientY;
    for (let i = 0; i < 45; i++) {
      const heart = document.createElement('div');
      heart.className = 'heart-particle';
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      heart.style.setProperty('--tx', `${(Math.random() - 0.5) * 700}px`);
      heart.innerHTML = `<span style="font-size: ${Math.random() * 20 + 12}px; color: ${i % 2 === 0 ? '#FFB7C5' : '#FADADD'}">${i % 3 === 0 ? '♥' : (i % 3 === 1 ? '✿' : '✧')}</span>`;
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 3200);
    }
    setShowHidden(true);
  };

  const updateConfig = (path: string[], value: any) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    let current = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setConfig(newConfig);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photos' | 'videos', index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const next = [...config[type]];
      next[index].url = result;
      updateConfig([type], next);
    };
    reader.readAsDataURL(file);
  };

  const addMedia = (type: 'photos' | 'videos') => {
    const newConfig = { ...config };
    if (type === 'photos') {
      newConfig.photos.push({ url: '', label: 'New Memory' });
    } else {
      newConfig.videos.push({ url: '', title: 'New Fragment' });
    }
    setConfig(newConfig);
  };

  const removeMedia = (type: 'photos' | 'videos', index: number) => {
    const newConfig = { ...config };
    newConfig[type].splice(index, 1);
    setConfig(newConfig);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden selection:bg-softPink/30 text-gray-800">
      <FloatingElements />
      
      <audio ref={transitionAudioRef} src={config.audio.slideSound} preload="auto" />
      <audio ref={bgMusicRef} src={config.audio.bgMusic} loop preload="auto" />

      {/* Modern Fixed Controls */}
      <div className="fixed top-6 left-6 z-[100] flex gap-4">
        <button 
          onClick={() => setIsEditorOpen(!isEditorOpen)}
          className="w-11 h-11 rounded-full bg-white/50 backdrop-blur-2xl border border-white/80 flex items-center justify-center transition-all hover:rotate-90 hover:scale-110 shadow-xl text-softPink active:scale-95 group"
          aria-label="Toggle Customizer"
        >
          <svg className="group-hover:text-warmRose" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>

      <div className={`fixed top-0 left-0 h-full w-[350px] bg-ivory/95 backdrop-blur-3xl z-[95] shadow-2xl transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${isEditorOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto p-8 pt-24 border-r border-softPink/15 custom-scrollbar`}>
        <div className="space-y-10">
          <header className="border-b border-softPink/20 pb-5">
            <h2 className="text-2xl font-serif italic text-gray-800">Space Editor</h2>
            <p className="text-[10px] text-softPink uppercase tracking-[0.3em] font-black mt-2">Personalize the vibe</p>
          </header>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-softPink/70">Soundscape</h4>
            <input className="w-full bg-white/70 p-3 rounded-xl border border-softPink/10 text-[10px] focus:border-softPink outline-none" value={config.audio.bgMusic} onChange={(e) => updateConfig(['audio', 'bgMusic'], e.target.value)} placeholder="MP3 Link" />
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-softPink/70">The Words</h4>
            <div className="space-y-3">
              <input className="w-full bg-white/70 p-3 rounded-xl border border-softPink/10 text-sm font-serif focus:border-softPink outline-none" value={config.messages.intro.heading} onChange={(e) => updateConfig(['messages', 'intro', 'heading'], e.target.value)} />
              <textarea className="w-full bg-white/70 p-3 rounded-xl border border-softPink/10 text-xs h-24 font-serif leading-relaxed focus:border-softPink outline-none" value={config.messages.appreciation.p1} onChange={(e) => updateConfig(['messages', 'appreciation', 'p1'], e.target.value)} />
              <textarea className="w-full bg-white/70 p-3 rounded-xl border border-softPink/10 text-xs h-24 font-serif leading-relaxed focus:border-softPink outline-none" value={config.messages.appreciation.p2} onChange={(e) => updateConfig(['messages', 'appreciation', 'p2'], e.target.value)} />
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-softPink/70">Gallery (Photos)</h4>
            <div className="space-y-5">
              {config.photos.map((p: any, i: number) => (
                <div key={i} className="bg-white/50 p-4 rounded-3xl border border-softPink/10 space-y-3 relative">
                  <button onClick={() => removeMedia('photos', i)} className="absolute top-3 right-3 text-red-300 hover:text-red-500 transition-colors">✕</button>
                  <input className="w-full bg-white p-2.5 rounded-xl text-[9px] border border-softPink/5" value={p.url.startsWith('data:') ? 'Local file uploaded' : p.url} onChange={(e) => {
                    const next = [...config.photos]; next[i].url = e.target.value; updateConfig(['photos'], next);
                  }} placeholder="Photo Link" />
                  <input type="file" accept="image/*" className="hidden" id={`img-upload-${i}`} onChange={(e) => handleFileUpload(e, 'photos', i)} />
                  <label htmlFor={`img-upload-${i}`} className="block w-full py-2 text-center bg-softPink/10 rounded-xl text-[9px] cursor-pointer hover:bg-softPink/20 text-softPink font-black uppercase tracking-widest transition-all">Upload File</label>
                  <input className="w-full bg-white p-2.5 rounded-xl text-[9px] border border-softPink/5" value={p.label} onChange={(e) => {
                    const next = [...config.photos]; next[i].label = e.target.value; updateConfig(['photos'], next);
                  }} placeholder="Moment Label" />
                </div>
              ))}
              <button onClick={() => addMedia('photos')} className="w-full py-3 border border-dashed border-softPink/30 rounded-2xl text-[10px] uppercase tracking-widest text-softPink/70 font-black hover:bg-softPink/5 transition-all">Add New Moment</button>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-softPink/70">Video Fragments</h4>
            <div className="space-y-5">
              {config.videos.map((v: any, i: number) => (
                <div key={i} className="bg-white/50 p-4 rounded-3xl border border-softPink/10 space-y-3 relative">
                  <button onClick={() => removeMedia('videos', i)} className="absolute top-3 right-3 text-red-300 hover:text-red-500">✕</button>
                  <input className="w-full bg-white p-2.5 rounded-xl text-[9px] border border-softPink/5" value={v.url.startsWith('data:') ? 'Local video uploaded' : v.url} onChange={(e) => {
                    const next = [...config.videos]; next[i].url = e.target.value; updateConfig(['videos'], next);
                  }} placeholder="Video Link" />
                  <input type="file" accept="video/mp4,video/webm" className="hidden" id={`vid-upload-${i}`} onChange={(e) => handleFileUpload(e, 'videos', i)} />
                  <label htmlFor={`vid-upload-${i}`} className="block w-full py-2 text-center bg-softPink/10 rounded-xl text-[9px] cursor-pointer hover:bg-softPink/20 text-softPink font-black uppercase tracking-widest transition-all">Upload Fragment</label>
                  <input className="w-full bg-white p-2.5 rounded-xl text-[9px] border border-softPink/5" value={v.title} onChange={(e) => {
                    const next = [...config.videos]; next[i].title = e.target.value; updateConfig(['videos'], next);
                  }} placeholder="Fragment Title" />
                </div>
              ))}
              <button onClick={() => addMedia('videos')} className="w-full py-3 border border-dashed border-softPink/30 rounded-2xl text-[10px] uppercase tracking-widest text-softPink/70 font-black hover:bg-softPink/5 transition-all">Add New Fragment</button>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-softPink/70">Thoughts</h4>
            {config.messages.thoughts.map((line: string, i: number) => (
              <div key={i} className="flex gap-3">
                <input className="flex-grow bg-white/70 p-2.5 rounded-xl border border-softPink/10 text-xs font-serif" value={line} onChange={(e) => {
                  const next = [...config.messages.thoughts]; next[i] = e.target.value; updateConfig(['messages', 'thoughts'], next);
                }} />
                <button onClick={() => {
                  const next = config.messages.thoughts.filter((_:any, idx:number) => idx !== i);
                  updateConfig(['messages', 'thoughts'], next);
                }} className="text-red-300 hover:text-red-500">✕</button>
              </div>
            ))}
            <button onClick={() => updateConfig(['messages', 'thoughts'], [...config.messages.thoughts, "New thought line"])} className="w-full py-2 border border-softPink/10 rounded-xl text-[9px] text-softPink/60 font-black uppercase tracking-widest">Add Line</button>
          </section>

          <section className="space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-softPink/70">Secret Message</h4>
            <div className="space-y-3">
              <input className="w-full bg-white/70 p-3 rounded-xl border border-softPink/10 text-xs font-serif" value={config.messages.hidden.prompt} onChange={(e) => updateConfig(['messages', 'hidden', 'prompt'], e.target.value)} />
              <textarea className="w-full bg-white/70 p-3 rounded-xl border border-softPink/10 text-xs h-28 font-serif leading-relaxed" value={config.messages.hidden.message} onChange={(e) => updateConfig(['messages', 'hidden', 'message'], e.target.value)} />
              <input className="w-full bg-white/70 p-3 rounded-xl border border-softPink/10 text-xs italic font-serif" value={config.messages.hidden.final} onChange={(e) => updateConfig(['messages', 'hidden', 'final'], e.target.value)} />
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-softPink/70">Final Farewell</h4>
            <div className="space-y-3">
              <input className="w-full bg-white/70 p-3 rounded-xl border border-softPink/10 text-xs font-serif" value={config.messages.closing.line1} onChange={(e) => updateConfig(['messages', 'closing', 'line1'], e.target.value)} />
              <input className="w-full bg-white/70 p-3 rounded-xl border border-softPink/10 text-xs font-serif" value={config.messages.closing.line2} onChange={(e) => updateConfig(['messages', 'closing', 'line2'], e.target.value)} />
            </div>
          </section>

          <button onClick={() => { if(confirm('Erase all changes?')) { setConfig(DEFAULT_CONFIG); window.location.reload(); } }} className="w-full py-8 text-[9px] uppercase tracking-[0.4em] text-gray-400 hover:text-red-400 font-black transition-all">Reset Space</button>
        </div>
      </div>

      <main className="relative z-20 h-full w-full flex items-center justify-center">
        {!hasStarted ? (
          <div className="text-center animate-fade-in-up px-6 max-w-2xl">
            <div className="mb-14 flex justify-center gap-12 opacity-30 text-5xl">
              <span className="animate-float-soft">✿</span><span className="animate-float-soft delay-[1s] text-softPink">✧</span><span className="animate-float-soft delay-[2s]">✿</span>
            </div>
            <h1 className="font-serif italic text-5xl md:text-7xl text-gray-800 mb-12 tracking-tight leading-tight font-light">{config.messages.intro.heading}</h1>
            <button 
              onClick={startExperience} 
              className="px-16 py-6 bg-white/60 backdrop-blur-3xl border border-white/80 rounded-full transition-all duration-700 hover:scale-110 active:scale-95 shadow-2xl font-sans text-[11px] tracking-[1.2em] uppercase font-black text-gray-700 btn-hover-pink"
            >
              Begin
            </button>
            <p className="mt-10 text-[10px] text-softPink uppercase tracking-[1.2em] font-bold opacity-60 ml-[1.2em]">{config.messages.intro.subtext}</p>
          </div>
        ) : (
          <div className={`w-full h-full flex items-center justify-center transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) px-6 md:px-12 ${isTransitioning ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100 blur-0'}`}>
            
            {currentSlide === 0 && (
              <div className="text-center animate-fade-in-up max-w-4xl mx-auto">
                <div className="mb-12 flex justify-center gap-10 opacity-30 text-4xl">
                   <span className="animate-float-soft">✿</span><span className="animate-pulse-gentle text-softPink delay-500">✧</span><span className="animate-float-soft delay-1000">✿</span>
                </div>
                <h1 className="font-serif italic text-5xl md:text-8xl text-gray-800 mb-8 tracking-tighter leading-[1.1] font-light">{config.messages.intro.heading}</h1>
                <p className="font-sans text-softPink font-black tracking-[1.8em] uppercase text-[11px] opacity-80 ml-[1.8em]">{config.messages.intro.subtext}</p>
              </div>
            )}

            {currentSlide === 1 && (
              <div className="max-w-3xl mx-auto animate-fade-in-up">
                <div className="bg-white/30 backdrop-blur-3xl p-10 md:p-20 rounded-[4rem] border border-white/80 shadow-[0_40px_100px_-30px_rgba(255,183,197,0.3)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-serif">“</div>
                  <div className="font-serif text-2xl md:text-4xl leading-relaxed md:leading-[1.8] text-gray-700 italic font-light space-y-12 relative z-10">
                    <p className="animate-fade-in-up">{config.messages.appreciation.p1}</p>
                    <div className="h-px w-20 bg-softPink/30 mx-auto rounded-full" />
                    <p className="text-softPink text-right md:text-5xl font-light italic pr-8 border-r-[3px] border-softPink/20 animate-fade-in-up delay-700">{config.messages.appreciation.p2}</p>
                  </div>
                </div>
              </div>
            )}

            {currentSlide === 2 && (
              <div className="text-center w-full animate-fade-in-up max-w-6xl mx-auto py-10 overflow-y-auto custom-scrollbar h-full flex flex-col justify-center">
                <h2 className="font-serif text-4xl md:text-6xl mb-14 text-gray-800 italic tracking-tighter font-light">{config.messages.galleryTitle}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 px-8">
                  {config.photos.map((item: any, idx: number) => (
                    <div key={idx} className="group relative bg-white/60 backdrop-blur-3xl p-5 rounded-[3.5rem] border border-white shadow-2xl card-hover-effect">
                      <div className="aspect-[4/5] overflow-hidden rounded-[2.8rem] bg-softBeige relative">
                        {item.url ? (
                          <img src={item.url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl text-softPink/20">✿</div>
                        )}
                        <div className="absolute inset-0 bg-softPink/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <p className="mt-6 font-serif italic text-sm text-gray-500 group-hover:text-softPink transition-colors tracking-widest uppercase font-bold">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentSlide === 3 && (
              <div className="max-w-7xl mx-auto animate-fade-in-up h-full flex flex-col justify-center py-10 overflow-y-auto custom-scrollbar">
                <h2 className="text-center font-serif text-4xl md:text-6xl italic text-gray-800 mb-14 tracking-tighter font-light">{config.messages.videoTitle}</h2>
                <div className="flex flex-col gap-16 justify-center px-8 pb-10">
                  {config.videos.map((vid: any, idx: number) => (
                    <VideoItem key={idx} vid={vid} />
                  ))}
                </div>
                <p className="text-center mt-12 font-serif italic text-softPink/60 text-lg tracking-wide shrink-0">Touch a fragment to breathe life into it.</p>
              </div>
            )}

            {currentSlide === 4 && (
              <div className="flex flex-col items-center gap-24 text-center px-8 py-20 animate-fade-in-up max-w-5xl mx-auto">
                {config.messages.thoughts.map((line: string, i: number) => (
                   <div key={i} className="relative group">
                      <p className="text-gray-700 font-serif italic text-4xl md:text-7xl leading-[1.2] tracking-tighter hover:text-softPink transition-all duration-1000 hover:scale-105 cursor-default font-light">{line}</p>
                      <div className="mt-8 h-[2px] w-0 group-hover:w-32 bg-softPink transition-all duration-1000 mx-auto rounded-full opacity-40" />
                   </div>
                ))}
              </div>
            )}

            {currentSlide === 5 && (
              <div className="max-w-2xl mx-auto text-center px-6 animate-fade-in-up">
                <div 
                  onClick={triggerHeartBurst} 
                  className={`group cursor-pointer bg-white/40 backdrop-blur-3xl p-14 md:p-24 rounded-[6rem] shadow-[0_50px_100px_-20px_rgba(255,183,197,0.3)] transition-all duration-[1.2s] border border-white/90 ${showHidden ? 'scale-105 border-softPink/40' : 'hover:-translate-y-2'}`}
                >
                  <h3 className="font-serif text-3xl md:text-4xl text-gray-800 mb-10 italic tracking-tight opacity-90 font-light">{config.messages.hidden.prompt}</h3>
                  <div className={`transition-all duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] ${showHidden ? 'opacity-100 mt-12 scale-100' : 'opacity-0 scale-95 max-h-0 overflow-hidden'}`}>
                    <div className="text-gray-600 font-serif text-xl md:text-3xl leading-relaxed italic space-y-12 font-light">
                      <p>{config.messages.hidden.message}</p>
                      <p className="text-softPink font-black text-5xl md:text-8xl tracking-tighter animate-pulse-gentle mt-14">{config.messages.hidden.final}</p>
                    </div>
                  </div>
                  {!showHidden && (
                    <button className="mt-10 px-16 py-5 rounded-full bg-softPink text-white text-[10px] tracking-[1.4em] uppercase font-black hover:bg-warmRose transition-all shadow-xl btn-hover-pink ml-[1.4em]">Reveal</button>
                  )}
                </div>
              </div>
            )}

            {currentSlide === 6 && (
              <div className="text-center px-6 animate-fade-in-up max-w-5xl mx-auto">
                <p className="font-serif text-gray-800 italic text-5xl md:text-8xl leading-none tracking-tighter mb-10 font-light">{config.messages.closing.line1}</p>
                <p className="font-serif text-softPink italic text-3xl md:text-5xl opacity-80 tracking-tight leading-relaxed font-light">{config.messages.closing.line2}</p>
                <div className="mt-24 text-6xl opacity-20 flex justify-center gap-16">
                   <span className="animate-float-soft">✿</span><span className="animate-float-soft text-softPink delay-700">♥</span><span className="animate-float-soft delay-1500">✿</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Elegant Nav Control */}
      {hasStarted && (
        <nav className="fixed bottom-10 left-0 w-full flex flex-col items-center gap-10 z-50 px-6">
          <div className="flex items-center gap-10 md:gap-14 bg-white/40 backdrop-blur-2xl px-10 py-4 rounded-full border border-white shadow-2xl">
            <button onClick={handlePrev} disabled={currentSlide === 0} className={`w-11 h-11 rounded-full border border-white/50 bg-white/20 flex items-center justify-center transition-all ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-110 active:scale-90 text-softPink hover:text-warmRose'}`}><span className="text-xl transform rotate-180">➜</span></button>
            <div className="flex gap-4">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button key={idx} onClick={() => { playSlideSound(); setCurrentSlide(idx); }} className={`h-2 rounded-full transition-all duration-1000 ${currentSlide === idx ? 'bg-softPink w-12 md:w-20 shadow-md' : 'bg-gray-400/20 w-2 hover:bg-softPink/30'}`} />
              ))}
            </div>
            <button onClick={handleNext} disabled={currentSlide === totalSlides - 1} className={`w-11 h-11 rounded-full border border-white/50 bg-white/20 flex items-center justify-center transition-all ${currentSlide === totalSlides - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-110 active:scale-90 text-softPink hover:text-warmRose'}`}><span className="text-xl">➜</span></button>
          </div>
        </nav>
      )}

      {/* Audio Toggle */}
      {hasStarted && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-6">
          <MusicVisualizer isPlaying={hasStarted} isMuted={isMuted} />
          <button onClick={() => { setIsMuted(!isMuted); if(bgMusicRef.current) bgMusicRef.current.muted = !isMuted; }} className="w-11 h-11 rounded-full bg-white/40 backdrop-blur-2xl flex items-center justify-center border border-white shadow-xl text-softPink transition-all hover:scale-110 active:scale-90">
            <span className="text-xl opacity-80">{isMuted ? '🔇' : '🔊'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
