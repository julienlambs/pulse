import { useState, useEffect, useRef } from 'react'
import { useTheme, useViseurFocus, SphinxBackground } from '@declic/ui'
import { apiFetch } from './lib/api'
import Header from './components/layout/Header'
import BottomNav, { MenuOnglets } from './components/layout/BottomNav'
import FeedTab from './components/feed/FeedTab'
import Reader from './components/reader/Reader'
import SavedPage from './pages/SavedPage'
import Login from './pages/Login'
import AdminPage from './components/admin/AdminPage'

export default function App() {
  useTheme()
  useViseurFocus()

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
      <>
        <SphinxBackground />
        <Login onLogin={handleLogin} />
      </>
    )
  }

  const onFeed = page === 'feed'

  return (
    <>
      <SphinxBackground />
      {/* Lecteur ouvert : la coquille reste montée (état du feed, position de défilement), mais cachée et inerte */}
      <div className="coquille" inert={currentItem ? '' : undefined} style={currentItem ? { visibility: 'hidden' } : undefined}>
        {onFeed && <MenuOnglets activeTab={activeTab} onTabChange={setActiveTab} />}
        <div className="coquille-col">
          <main className="coquille-main">
            {onFeed && (
              <>
                <Header onSavedClick={() => setPage('saved')} onAdminClick={handleAdminClick} />
                <div ref={mainRef} className="defile">
                  <FeedTab
                    key={activeTab}
                    tab={activeTab}
                    sourcesMap={sourcesMap}
                    savedOverrides={savedOverrides}
                    onItemClick={handleItemClick}
                  />
                </div>
              </>
            )}

            {page === 'saved' && (
              <SavedPage
                sourcesMap={sourcesMap}
                onBack={handleBackToFeed}
                onItemClick={handleItemClick}
              />
            )}

            {page === 'admin' && (
              <AdminPage
                token={authToken}
                onBack={handleBackToFeed}
                onLogout={handleLogout}
              />
            )}
          </main>
          {onFeed && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
        </div>
      </div>

      {currentItem && (
        <Reader
          item={currentItem}
          sourceName={sourcesMap[currentItem.source_id]?.name}
          onBack={handleBackFromReader}
          onSaveUpdate={handleSaveUpdateFromReader}
        />
      )}
    </>
  )
}
