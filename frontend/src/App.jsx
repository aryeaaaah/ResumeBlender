import React, { useState } from 'react'
import FileUploader from './components/FileUploader.jsx'
import ScoreCard    from './components/ScoreCard.jsx'
import OutputPanel  from './components/OutputPanel.jsx'

const BTN = (bg, color, extra = {}) => ({
  fontFamily: 'var(--font-mono)',
  fontWeight: 600,
  fontSize: 13,
  border: 'none',
  borderRadius: 10,
  padding: '12px 24px',
  cursor: 'pointer',
  letterSpacing: 0.5,
  transition: 'all 0.2s',
  background: bg,
  color: color,
  ...extra,
})

// ── Steps ─────────────────────────────────────────────────────────────────────
// 1. Open browser  → user logs in → confirm login
// 2. Fill inputs   → click Analyse → see original score
// 3. Click Tailor  → see both scores
// 4. Click Cover Letter → download both files

export default function App() {
  // Login state
  const [browserOpen,    setBrowserOpen]    = useState(false)
  const [loggedIn,       setLoggedIn]       = useState(false)

  // Inputs
  const [jd,             setJd]             = useState('')
  const [resumeFile,     setResumeFile]     = useState(null)
  const [guideFile,      setGuideFile]      = useState(null)

  // Results
  const [originalScore,  setOriginalScore]  = useState(null)
  const [tailoredScore,  setTailoredScore]  = useState(null)
  const [outputResume,   setOutputResume]   = useState(null)
  const [outputCover,    setOutputCover]    = useState(null)

  // UI state
  const [status,         setStatus]         = useState('')
  const [error,          setError]          = useState('')
  const [tailorDone,     setTailorDone]     = useState(false)

  // ── Derived booleans ────────────────────────────────────────────────────────
  const canAnalyse = loggedIn && jd.trim() && resumeFile && guideFile && !status
  const canTailor  = originalScore && !status
  const canCover   = tailorDone && !status

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleOpenBrowser() {
    setError('')
    setStatus('Opening browser...')
    try {
      const res  = await fetch('/open-browser', { method: 'POST' })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setBrowserOpen(true)
    } catch (e) {
      setError('Could not reach backend. Is it running?')
    } finally {
      setStatus('')
    }
  }

  async function handleConfirmLogin() {
    setError('')
    setStatus('Confirming login...')
    try {
      const res  = await fetch('/confirm-login', { method: 'POST' })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setLoggedIn(true)
    } catch (e) {
      setError('Login confirmation failed.')
    } finally {
      setStatus('')
    }
  }

  async function handleAnalyse() {
    setError('')
    setStatus('Scoring your resume...')
    setOriginalScore(null)
    setTailoredScore(null)
    setOutputResume(null)
    setOutputCover(null)
    setTailorDone(false)

    const form = new FormData()
    form.append('job_description',  jd)
    form.append('resume_file',      resumeFile)
    form.append('guidelines_file',  guideFile)

    try {
      const res  = await fetch('/analyse', { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setOriginalScore(data.original_score)
    } catch (e) {
      setError('Analyse failed.')
    } finally {
      setStatus('')
    }
  }

  async function handleTailor() {
    setError('')
    setStatus('Tailoring resume with Claude...')
    try {
      const res  = await fetch('/tailor', { method: 'POST' })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setTailoredScore(data.tailored_score)
      setOutputResume({ name: data.filename, url: data.download_url })
      setTailorDone(true)
    } catch (e) {
      setError('Tailoring failed.')
    } finally {
      setStatus('')
    }
  }

  async function handleCoverLetter() {
    setError('')
    setStatus('Writing cover letter...')
    try {
      const res  = await fetch('/cover-letter', { method: 'POST' })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setOutputCover({ name: data.filename, url: data.download_url })
    } catch (e) {
      setError('Cover letter failed.')
    } finally {
      setStatus('')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px', maxWidth: 880, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontFamily: 'var(--font-head)', fontSize: 11,
          letterSpacing: 3, color: 'var(--accent)',
          textTransform: 'uppercase', marginBottom: 10
        }}>
          AI-Powered
        </div>
        <h1 style={{
          fontFamily: 'var(--font-head)', fontSize: 42,
          fontWeight: 800, color: 'var(--text)',
          lineHeight: 1.1, marginBottom: 10
        }}>
          Resume Tailor
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          Upload your resume and a job description — get a scored, tailored resume and cover letter via Claude.
        </p>
      </div>

      {/* ── Step 1: Browser Login ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 20
      }}>
        <div style={{
          fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700,
          letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16
        }}>
          Step 1 — Browser Login
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenBrowser}
            disabled={browserOpen || !!status}
            style={BTN(
              browserOpen ? 'var(--border)' : 'var(--accent)', '#fff'
            )}
          >
            {browserOpen ? '✓ Browser Opened' : '🌐  Open Claude in Browser'}
          </button>

          {browserOpen && !loggedIn && (
            <button
              onClick={handleConfirmLogin}
              disabled={!!status}
              style={BTN('var(--yellow)', '#0d0f14')}
            >
              ✓  I Have Logged In
            </button>
          )}

          {loggedIn && (
            <span style={{
              color: 'var(--green)', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              ✓ Logged in — ready
            </span>
          )}
        </div>
      </div>

      {/* ── Step 2: Inputs ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 20,
        opacity: loggedIn ? 1 : 0.45, transition: 'opacity 0.3s',
        pointerEvents: loggedIn ? 'all' : 'none',
      }}>
        <div style={{
          fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700,
          letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16
        }}>
          Step 2 — Inputs
        </div>

        <label style={{
          display: 'block', fontSize: 11, color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8
        }}>
          Job Description
        </label>
        <textarea
          value={jd}
          onChange={e => setJd(e.target.value)}
          placeholder="Paste the full job description here..."
          style={{
            width: '100%', minHeight: 160,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text)',
            fontFamily: 'var(--font-mono)', fontSize: 13,
            padding: '14px 16px', resize: 'vertical',
            marginBottom: 16, lineHeight: 1.6,
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <FileUploader
            label="Resume (.pdf)"
            accept=".pdf"
            file={resumeFile}
            onFile={setResumeFile}
            icon="📄"
          />
          <FileUploader
            label="Style Guide (.md)"
            accept=".md"
            file={guideFile}
            onFile={setGuideFile}
            icon="📋"
          />
        </div>

        <button
          onClick={handleAnalyse}
          disabled={!canAnalyse}
          style={BTN(
            canAnalyse ? 'var(--accent)' : 'var(--border)',
            canAnalyse ? '#fff' : 'var(--muted)',
            { width: '100%' }
          )}
        >
          {status === 'Scoring your resume...' ? '⏳  Scoring...' : '▶  Analyse & Score'}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'rgba(247,110,110,0.08)',
          border: '1px solid var(--red)',
          borderRadius: 10, padding: '12px 16px',
          marginBottom: 16, color: 'var(--red)', fontSize: 13,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Loading status ── */}
      {status && (
        <div style={{
          textAlign: 'center', color: 'var(--muted)',
          fontSize: 13, marginBottom: 16
        }}>
          ⏳ {status}
        </div>
      )}

      {/* ── Score Card ── */}
      {originalScore && (
        <ScoreCard original={originalScore} tailored={tailoredScore} />
      )}

      {/* ── Step 3 & 4: Action Buttons ── */}
      {originalScore && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
          <button
            onClick={handleTailor}
            disabled={!canTailor}
            style={BTN(
              canTailor ? 'var(--accent2)' : 'var(--border)',
              canTailor ? '#fff' : 'var(--muted)'
            )}
          >
            {status === 'Tailoring resume with Claude...' ? '⏳  Tailoring...' : '✦  Generate Tailored Resume'}
          </button>

          <button
            onClick={handleCoverLetter}
            disabled={!canCover}
            style={BTN(
              canCover ? 'var(--green)' : 'var(--border)',
              canCover ? '#0d0f14' : 'var(--muted)'
            )}
          >
            {status === 'Writing cover letter...' ? '⏳  Writing...' : '✉  Generate Cover Letter'}
          </button>
        </div>
      )}

      {/* ── Output Files ── */}
      <OutputPanel resumeFile={outputResume} coverFile={outputCover} />

    </div>
  )
}