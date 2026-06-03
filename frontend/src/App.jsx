import { useState, useEffect, useRef } from 'react'
import { useTheme } from './lib/themes'
import { apiFetch } from './lib/api'
import HexBackground from './components/HexBackground'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import FeedTab from './components/feed/FeedTab'
import Reader from './components/reader/Reader'
import SavedPage from './pages/SavedPage'
import Login from './pages/Login'
import AdminPage from './components/admin/AdminPage'

export default function App() {
  useTheme()

  const [activeTab, setActiveTab]           = useState('ai_product')
  const [sourcesMap, setSourcesMap]         = useState({})
  const [page, setPage]                     = useState('feed')  // 'feed' | 'saved' | 'login' | 'admin'
  const [authToken, setAuthToken]           = useState(() => localStorage.getItem('pulse_token') || null)
  const [currentItem, setCurrentItem]       = useState(null)
  const [savedOverrides, setSavedOverrides] = useState({})
  const mainRef      = useRef(null)
  const scrollPosRef = useRef(0)

  useEffect(() => {
    if (!authToken) return
    apiFetch('/api/sources')
      .then(r => r.json())
      .then(sources => {
        const map = {}
        sources.forEach(s => { map[s.id] = s })
        setSourcesMap(map)
      })
      .catch(() => {})
  }, [authToken])

  function handleItemClick(item) {
    if (!item.content) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (mainRef.current) scrollPosRef.current = mainRef.current.scrollTop
    setCurrentItem(item)
  }

  function handleBackFromReader() {
    setCurrentItem(null)
    requestAnimationFrame(() => {
      if (mainRef.current) mainRef.current.scrollTop = scrollPosRef.current
    })
  }

  function handleSaveUpdateFromReader(itemId, newIsSaved) {
    setSavedOverrides(prev => ({ ...prev, [itemId]: newIsSaved }))
  }

  function handleLogin(token) {
    setAuthToken(token)
    setPage('feed')
  }

  function handleLogout() {
    localStorage.removeItem('pulse_token')
    setAuthToken(null)
  }

  function handleAdminClick() {
    setPage('admin')
  }

  function handleBackToFeed() {
    setPage('feed')
  }

  if (!authToken) {
    return (
      <div style={{ height: '100dvh', background: 'var(--bg)' }}>
        <Login onLogin={handleLogin} />
      </div>
    )
  }

  const showHeader  = page === 'feed'
  const showNavBar  = page === 'feed'

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <HexBackground />
      {showHeader && (
        <Header
          onSavedClick={() => setPage('saved')}
          onAdminClick={handleAdminClick}
        />
      )}

      <main
        ref={mainRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          marginTop: showHeader ? 56 : 0,
          marginBottom: showNavBar ? 60 : 0,
        }}
      >
        {page === 'feed' && (
          <FeedTab
            key={activeTab}
            tab={activeTab}
            sourcesMap={sourcesMap}
            savedOverrides={savedOverrides}
            onItemClick={handleItemClick}
          />
        )}

        {page === 'saved' && (
          <SavedPage
            sourcesMap={sourcesMap}
            onBack={handleBackToFeed}
            onItemClick={handleItemClick}
          />
        )}

        {page === 'login' && (
          <Login onLogin={handleLogin} />
        )}

        {page === 'admin' && (
          <AdminPage
            token={authToken}
            onBack={handleBackToFeed}
            onLogout={handleLogout}
          />
        )}
      </main>

      {showNavBar && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {currentItem && (
        <Reader
          item={currentItem}
          sourceName={sourcesMap[currentItem.source_id]?.name}
          onBack={handleBackFromReader}
          onSaveUpdate={handleSaveUpdateFromReader}
        />
      )}
    </div>
  )
}
