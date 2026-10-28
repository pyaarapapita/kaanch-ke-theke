import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  useEffect(() => {
    const pageTitle = 'पृष्ठ नहीं मिला (404) | Kaanch Ke Theke — Page Not Found'
    const pageDesc = 'माफ़ करें, आप जिस पृष्ठ की तलाश कर रहे हैं, वह काँच के ठेके पर उपलब्ध नहीं है। मुख्य पृष्ठ या प्लेलिस्ट्स पर वापस आएं।'
    const pageUrl = 'https://kaanch-ke-theke.pages.dev/404'

    document.title = pageTitle

    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', pageDesc)

    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', pageUrl)

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', pageTitle)
    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', pageDesc)

    return () => {
      const defaultTitle = 'काँच के ठेके | Kaanch Ke Theke — Retro Bollywood Music & Nostalgic Hindi Melodies'
      const defaultDesc = 'काँच के ठेके (Kaanch Ke Theke) — पुराने बॉलीवुड गानों, यादों और महफ़िल का एक सिनेमाई संगीत अनुभव। 90s के सदाबहार नग़मे, ग़ज़लें और रेट्रो हिंदी क्लासिक्स।'
      document.title = defaultTitle
      if (metaDesc) metaDesc.setAttribute('content', defaultDesc)
    }
  }, [])

  return (
    <div className="page-content-wrapper not-found-page-wrapper">
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">
            <Link to="/" className="breadcrumb-link">मुख्य पृष्ठ (Home)</Link>
          </li>
          <li className="breadcrumb-separator">/</li>
          <li className="breadcrumb-item active" aria-current="page">404 — पृष्ठ नहीं मिला</li>
        </ol>
      </nav>

      <section className="editorial-section not-found-section" aria-label="404 — पृष्ठ नहीं मिला">
        <div className="editorial-container not-found-container">
          <div className="not-found-content-card">
            <div className="not-found-badge-row">
              <span className="editorial-badge">गलत रास्ता • Wrong Route</span>
              <span className="editorial-meta">HTTP 404</span>
            </div>

            <div className="not-found-hero">
              <div className="not-found-numeral" aria-hidden="true">
                404
              </div>
              <h1 className="not-found-title">
                शायद रास्ता भटक गए हैं आप...
              </h1>
              <p className="not-found-shayari">
                "रास्ता भटकना भी महफ़िल की एक ख़ूबसूरती है जनाब,<br />
                मगर सुकून भरी धुनें आपको मुख्य पृष्ठ पर ही मिलेंगी।"
              </p>
              <p className="not-found-desc">
                माफ़ कीजिए, जो पृष्ठ आप तलाश रहे हैं वह मौजूद नहीं है या हटा दिया गया है। अपनी पसंद की धुन सुनने के लिए नीचे दिए गए विकल्पों में से चुनें:
              </p>
            </div>

            <div className="not-found-actions">
              <Link to="/" className="not-found-primary-btn" aria-label="ठेके के मुख्य पृष्ठ पर जाएं">
                ← मुख्य पृष्ठ पर वापस जाएं (Home)
              </Link>
              <Link to="/playlists" className="not-found-secondary-btn" aria-label="सभी प्लेलिस्ट्स देखें">
                सभी प्लेलिस्ट्स देखें (Playlists) →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default NotFoundPage
