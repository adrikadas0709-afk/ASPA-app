import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { ChatProvider } from './context/ChatContext'
import Layout from './components/layout/Layout'

const Home                    = lazy(() => import('./pages/Home'))
const Assistant               = lazy(() => import('./pages/Assistant'))
const CircuitTroubleshooter   = lazy(() => import('./pages/CircuitTroubleshooter'))
const FilterDesigner          = lazy(() => import('./pages/FilterDesigner'))
const AmplifierDesigner       = lazy(() => import('./pages/AmplifierDesigner'))
const AudioAnalyzer           = lazy(() => import('./pages/AudioAnalyzer'))
const FrequencyResponsePlotter= lazy(() => import('./pages/FrequencyResponsePlotter'))
const SavedProjects           = lazy(() => import('./pages/SavedProjects'))
const Settings                = lazy(() => import('./pages/Settings'))
const About                   = lazy(() => import('./pages/About'))
const FilterAnalysis          = lazy(() => import('./pages/FilterAnalysis'))
const CircuitDesigner         = lazy(() => import('./pages/CircuitDesigner'))
const Equalizer               = lazy(() => import('./pages/Equalizer'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="typing-dot" style={{ width: 10, height: 10, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</span>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="assistant"              element={<Assistant />} />
                <Route path="circuit-troubleshooter" element={<CircuitTroubleshooter />} />
                <Route path="filter-designer"        element={<FilterDesigner />} />
                <Route path="amplifier"              element={<AmplifierDesigner />} />
                <Route path="audio-analyzer"         element={<AudioAnalyzer />} />
                <Route path="frequency-response"     element={<FrequencyResponsePlotter />} />
                <Route path="saved-projects"         element={<SavedProjects />} />
                <Route path="settings"               element={<Settings />} />
                <Route path="about"                  element={<About />} />
                <Route path="filter-analysis"        element={<FilterAnalysis />} />
                <Route path="circuit-designer"       element={<CircuitDesigner />} />
                <Route path="equalizer"              element={<Equalizer />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ChatProvider>
    </ThemeProvider>
  )
}
