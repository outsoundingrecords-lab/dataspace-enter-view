import React from 'react';
import { Settings, X, Eye, MonitorSmartphone, Wifi, Monitor, RotateCcw } from 'lucide-react';
import { usePreferences, ColorBlindnessProfile, HapticIntensity, HoverDelay, NetworkMode, ScalingMode } from '../context/PreferencesContext';

interface PreferencesModalProps {
  onClose: () => void;
}

export function PreferencesModal({ onClose }: PreferencesModalProps) {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const [activeTab, setActiveTab] = React.useState<'accessibility' | 'interactive' | 'offline' | 'hardware'>('accessibility');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950/50 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible hide-scrollbar">
          <div className="hidden md:flex items-center gap-2 px-2 py-3 mb-2 text-zinc-100 font-medium">
            <Settings className="w-5 h-5 text-indigo-400" />
            Preferences
          </div>
          
          <button
            onClick={() => setActiveTab('accessibility')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'accessibility' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            <Eye className="w-4 h-4" />
            Accessibility
          </button>
          
          <button
            onClick={() => setActiveTab('interactive')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'interactive' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            <MonitorSmartphone className="w-4 h-4" />
            Interactive & Response
          </button>
          
          <button
            onClick={() => setActiveTab('offline')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'offline' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            <Wifi className="w-4 h-4" />
            Offline Engine
          </button>
          
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'hardware' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            <Monitor className="w-4 h-4" />
            Hardware & Scaling
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950/30 shrink-0">
            <h3 className="font-medium text-zinc-200 capitalize">
              {activeTab === 'interactive' ? 'Interactive Response & Touch' : 
               activeTab === 'offline' ? 'Offline Engine & Sync' :
               activeTab === 'hardware' ? 'Adaptive Hardware & Data Density' :
               'Universal Accessibility (WCAG 2.2 AA)'}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={resetPreferences}
                className="text-zinc-500 hover:text-indigo-400 transition-colors p-1.5 rounded hover:bg-indigo-500/10 flex items-center gap-1 text-xs font-medium"
                title="Reset to Defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {activeTab === 'accessibility' && (
              <>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-100 mb-1">Visual & Contrast Adjustments</h4>
                    <p className="text-xs text-zinc-500 mb-4">Modify the visual appearance to ensure universal screen accessibility.</p>
                  </div>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex justify-between text-sm text-zinc-300">
                        <span>Dynamic Type Scaling</span>
                        <span className="text-indigo-400 font-mono">{preferences.typeScale}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="85" 
                        max="150" 
                        step="5"
                        value={preferences.typeScale}
                        onChange={(e) => updatePreferences({ typeScale: parseInt(e.target.value, 10) })}
                        className="w-full accent-indigo-500"
                      />
                      <p className="text-[10px] text-zinc-500">Scale text from 85% to 150% without truncating containers.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm text-zinc-300 mb-1">Color Blindness Profiles</label>
                      <select 
                        value={preferences.colorBlindness}
                        onChange={(e) => updatePreferences({ colorBlindness: e.target.value as ColorBlindnessProfile })}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="none">None (Standard Display)</option>
                        <option value="protanopia">Protanopia (Red-blind)</option>
                        <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                        <option value="tritanopia">Tritanopia (Blue-blind)</option>
                      </select>
                      <p className="text-[10px] text-zinc-500">Applies SVG matrix filters across analytics and badges.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 pt-4">
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          checked={preferences.highContrast}
                          onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
                          className="w-4 h-4 accent-indigo-500 bg-zinc-900 border-zinc-700 rounded"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-200">High Contrast Mode</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Enforces minimum 7:1 contrast ratio with sharp outlines.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          checked={preferences.reduceMotion}
                          onChange={(e) => updatePreferences({ reduceMotion: e.target.checked })}
                          className="w-4 h-4 accent-indigo-500 bg-zinc-900 border-zinc-700 rounded"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-200">Reduce Motion</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Disables non-essential GPU animations, using instant cross-fades.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-zinc-800/80">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-100 mb-1">Motor & Input Enhancements</h4>
                    <p className="text-xs text-zinc-500 mb-4">Optimize touch targets, focus rings, and gesture sensitivity.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          checked={preferences.touchTargetExpansion}
                          onChange={(e) => updatePreferences({ touchTargetExpansion: e.target.checked })}
                          className="w-4 h-4 accent-indigo-500 bg-zinc-900 border-zinc-700 rounded"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-200">Touch Target Expansion</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Expands mobile touch target bounding boxes to 52×52pt minimum.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          checked={preferences.stickyFocusRings}
                          onChange={(e) => updatePreferences({ stickyFocusRings: e.target.checked })}
                          className="w-4 h-4 accent-indigo-500 bg-zinc-900 border-zinc-700 rounded"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-200">Sticky Focus Rings</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Enforces 2px high-contrast outlines for keyboard navigation.</div>
                      </div>
                    </label>
                  </div>

                  <div className="pt-4 max-w-md">
                    <label className="flex justify-between text-sm text-zinc-300 mb-2">
                      <span>Gesture Sensitivity Control</span>
                      <span className="text-indigo-400 font-mono">{preferences.gestureSensitivity}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={preferences.gestureSensitivity}
                      onChange={(e) => updatePreferences({ gestureSensitivity: parseInt(e.target.value, 10) })}
                      className="w-full accent-indigo-500"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Adjusts swipe threshold distance for drawer dismissal.</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'interactive' && (
              <>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-100 mb-1">Mobile Response Matrix</h4>
                    <p className="text-xs text-zinc-500 mb-4">Tune tactile feedback and refresh rates for touch displays.</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm text-zinc-300 mb-1">Haptic Feedback Intensity</label>
                      <select 
                        value={preferences.hapticFeedback}
                        onChange={(e) => updatePreferences({ hapticFeedback: e.target.value as HapticIntensity })}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="off">Off (No vibration)</option>
                        <option value="subtle">Subtle (Light impact on tabs/toggles)</option>
                        <option value="standard">Standard (Medium impact on lists/forms)</option>
                        <option value="strong">Strong (Heavy impact on destructive actions)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm text-zinc-300 mb-1">ProMotion & Refresh Rate</label>
                      <select 
                        value={preferences.targetRefreshRate}
                        onChange={(e) => updatePreferences({ targetRefreshRate: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value, 10) as 60 | 120 })}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="auto">Auto (Drops to 60Hz on battery saver)</option>
                        <option value="120">Target 120Hz (ProMotion)</option>
                        <option value="60">Lock to 60Hz (Save battery)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-zinc-800/80">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-100 mb-1">Desktop Interaction Matrix</h4>
                    <p className="text-xs text-zinc-500 mb-4">Optimize global shortcuts and pointer hover states.</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm text-zinc-300 mb-1">Hover State Delays</label>
                      <select 
                        value={preferences.hoverDelay}
                        onChange={(e) => updatePreferences({ hoverDelay: parseInt(e.target.value, 10) as HoverDelay })}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value={0}>0ms (Instant Tooltips)</option>
                        <option value={200}>200ms (Default)</option>
                        <option value={500}>500ms (Prevent visual clutter during traversal)</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 flex flex-col justify-center">
                      <div className="text-sm font-medium text-zinc-200 mb-1">Global Command Palette</div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                        Use <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-zinc-300">Cmd+K</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-zinc-300">Ctrl+K</kbd> for rapid context switching.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'offline' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-zinc-100 mb-1">Offline Engine & State Synchronization</h4>
                  <p className="text-xs text-zinc-500 mb-4">Ensure continuous productivity regardless of network conditions with IndexedDB/SQLite caching and background sync.</p>
                </div>

                <div className="space-y-3 max-w-lg">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Network Modes</label>
                  
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${preferences.networkMode === 'auto' ? 'bg-indigo-500/10 border-indigo-500/30' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}>
                    <div className="pt-1 text-indigo-400"><Wifi className="w-4 h-4" /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-zinc-200">Auto-Detect</div>
                        <input 
                          type="radio" 
                          name="networkMode"
                          value="auto"
                          checked={preferences.networkMode === 'auto'}
                          onChange={() => updatePreferences({ networkMode: 'auto' })}
                          className="accent-indigo-500"
                        />
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">Seamlessly toggles between Online and Offline states without interrupting operations. Background worker replays queued mutations.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${preferences.networkMode === 'force-offline' ? 'bg-amber-500/10 border-amber-500/30' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}>
                    <div className="pt-1 text-amber-400"><Wifi className="w-4 h-4" /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-zinc-200">Force Offline</div>
                        <input 
                          type="radio" 
                          name="networkMode"
                          value="force-offline"
                          checked={preferences.networkMode === 'force-offline'}
                          onChange={() => updatePreferences({ networkMode: 'force-offline' })}
                          className="accent-indigo-500"
                        />
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">Forces the application to use locally cached data to conserve mobile data or test performance.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${preferences.networkMode === 'low-data' ? 'bg-emerald-500/10 border-emerald-500/30' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}>
                    <div className="pt-1 text-emerald-400"><Wifi className="w-4 h-4" /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-zinc-200">Low Data Mode</div>
                        <input 
                          type="radio" 
                          name="networkMode"
                          value="low-data"
                          checked={preferences.networkMode === 'low-data'}
                          onChange={() => updatePreferences({ networkMode: 'low-data' })}
                          className="accent-indigo-500"
                        />
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">Restricts automatic media downloads, prefetching, and telemetry logging to Wi-Fi connections only.</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'hardware' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-zinc-100 mb-1">Hardware-Adaptive Scaling & Data Density Controls</h4>
                  <p className="text-xs text-zinc-500 mb-4">Tailor UI density, rendering complexity, and data prefetching to match your hardware capabilities.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-zinc-300">Scaling Mode</label>
                    {preferences.scalingMode === 'auto' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        Automatically detected via navigator.hardwareConcurrency
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    
                    <label className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${preferences.scalingMode === 'low-power' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700'}`}>
                      <input 
                        type="radio" 
                        name="scalingMode"
                        value="low-power"
                        checked={preferences.scalingMode === 'low-power'}
                        onChange={() => updatePreferences({ scalingMode: 'low-power' })}
                        className="absolute right-4 top-4 accent-indigo-500"
                      />
                      <div className="font-medium text-sm text-zinc-200 mb-2">Low-Power / Compact</div>
                      <div className="text-[11px] text-zinc-400 space-y-1.5 flex-1">
                        <p><strong className="text-zinc-300">Target:</strong> Older mobile, low-spec laptops</p>
                        <p><strong className="text-zinc-300">Data:</strong> Max 25 rows per list DOM node</p>
                        <p><strong className="text-zinc-300">Visuals:</strong> Static vector summaries; no animations</p>
                        <p><strong className="text-zinc-300">Scale:</strong> 110% - 120% touch areas</p>
                        <p><strong className="text-zinc-300">Prefetch:</strong> Disabled</p>
                        <p><strong className="text-zinc-300">FPS:</strong> 30 - 60 FPS cap</p>
                      </div>
                    </label>

                    <label className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${preferences.scalingMode === 'balanced' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700'}`}>
                      <input 
                        type="radio" 
                        name="scalingMode"
                        value="balanced"
                        checked={preferences.scalingMode === 'balanced'}
                        onChange={() => updatePreferences({ scalingMode: 'balanced' })}
                        className="absolute right-4 top-4 accent-indigo-500"
                      />
                      <div className="font-medium text-sm text-zinc-200 mb-2">Balanced Mode (Default)</div>
                      <div className="text-[11px] text-zinc-400 space-y-1.5 flex-1">
                        <p><strong className="text-zinc-300">Target:</strong> Standard smartphones, tablets</p>
                        <p><strong className="text-zinc-300">Data:</strong> Max 100 rows per list node</p>
                        <p><strong className="text-zinc-300">Visuals:</strong> Smooth Framer Motion / SVG</p>
                        <p><strong className="text-zinc-300">Scale:</strong> 100% baseline scale</p>
                        <p><strong className="text-zinc-300">Prefetch:</strong> Active tab prefetching</p>
                        <p><strong className="text-zinc-300">FPS:</strong> 60 FPS capped</p>
                      </div>
                    </label>

                    <label className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${preferences.scalingMode === 'high-density' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700'}`}>
                      <input 
                        type="radio" 
                        name="scalingMode"
                        value="high-density"
                        checked={preferences.scalingMode === 'high-density'}
                        onChange={() => updatePreferences({ scalingMode: 'high-density' })}
                        className="absolute right-4 top-4 accent-indigo-500"
                      />
                      <div className="font-medium text-sm text-zinc-200 mb-2">High-Density Analytics</div>
                      <div className="text-[11px] text-zinc-400 space-y-1.5 flex-1">
                        <p><strong className="text-zinc-300">Target:</strong> Multi-monitor workstations</p>
                        <p><strong className="text-zinc-300">Data:</strong> Infinite continuous scroll</p>
                        <p><strong className="text-zinc-300">Visuals:</strong> Real-time WebGL / Canvas</p>
                        <p><strong className="text-zinc-300">Scale:</strong> 80% - 90% compact scale</p>
                        <p><strong className="text-zinc-300">Prefetch:</strong> Aggressive multi-tab prefetch</p>
                        <p><strong className="text-zinc-300">FPS:</strong> Up to 120 FPS</p>
                      </div>
                    </label>

                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => updatePreferences({ scalingMode: 'auto' })}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${preferences.scalingMode === 'auto' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 cursor-default' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
                      disabled={preferences.scalingMode === 'auto'}
                    >
                      Enable Auto-Hardware Detection
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
