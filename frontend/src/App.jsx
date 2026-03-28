import React, { useState } from 'react'
import FileUploader from './components/FileUploader.jsx'
import ScoreCard    from './components/ScoreCard.jsx'
import OutputPanel  from './components/OutputPanel.jsx'

//TEMP AREA FOR TESTING USE ONLY (ui-upgrades)
import { score_response } from './temp_server_response/temp_data.jsx';
//END OF TEMP AREA
import ThemeToggle from './components/ThemeToggle.jsx'


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
//  const [guideFile,      setGuideFile]      = useState(null)

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
  //const canAnalyse = loggedIn && jd.trim() && resumeFile && guideFile && !status
  const canAnalyse = loggedIn && jd.trim() && resumeFile && !status
  const canTailor  = !!originalScore && !status
  const canCover   = tailorDone && !status

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleOpenBrowser() {
    setError('')
    setStatus('Opening browser...')
    try {
      // const res  = await fetch('/open-browser', { method: 'POST' })
      // const data = await res.json()
      const data = {"status": "opened"} // TESTING CODE
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
      // const res  = await fetch('/confirm-login', { method: 'POST' })
      // const data = await res.json()
      const data = {"status": "logged_in"} // TESTING CODE
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
    //form.append('guidelines_file',  guideFile)

    try {
      // const res  = await fetch('/analyse', { method: 'POST', body: form })
      // const data = await res.json()
      const data={"original_score": score_response} // TESTING CODE
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
      // const res  = await fetch('/tailor', { method: 'POST' })
      // const data = await res.json()
      // TESTING CODE
      const data = {
        "tailored_score": score_response,
        "original_score": score_response,
        "filename":       'potato potato',
        "download_url":   "/outputs/tailored_resume.docx"
      }
      // TESTING CODE
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
    <div style={{ minHeight: '100vh', padding: '24px 16px', maxWidth: '100%', margin: '0 auto' }}>
      <ThemeToggle />

      {/* ── Header ── */}
      <div style={{ marginBottom: 48 }}>

        {/* Masthead title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 60,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            margin: 0,
          }}>
            Resume
          </h1>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 60,
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: 'var(--muted)',
            margin: '0 0 0 18px',
          }}>
            Tailor
          </h1>
        </div>

        {/* Underline rule */}
        <div style={{
          width: '100%',
          height: 2,
          background: 'linear-gradient(90deg, var(--text) 0%, transparent 100%)',
          marginTop: 8,
          marginBottom: 12,
        }} />

        {/* Meta strip */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {['Scored', 'Tailored', 'Delivered'].map((item, i) => (
            <React.Fragment key={item}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 300,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}>{item}</span>
              {i < 2 && (
                <span style={{
                  width: 3, height: 3, borderRadius: '50%',
                  background: 'var(--border)', flexShrink: 0,
                }} />
              )}
            </React.Fragment>
          ))}
        </div> */}
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

      {/* ── 2 Column Layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '0.5fr 1fr',
        gap: 24,
        alignItems: 'start',
      }}>

        {/* ════════════════ LEFT COLUMN ════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Step 1 — Browser Login */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '24px 28px',
          }}>
            <div style={{
              fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700,
              letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase',
              marginBottom: 16
            }}>
              Step 1 — Browser Login
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleOpenBrowser}
                disabled={browserOpen || !!status}
                style={BTN(browserOpen ? 'var(--border)' : 'var(--accent)', '#fff')}
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

          {/* Step 2 — Inputs */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '24px 28px',
            opacity: loggedIn ? 1 : 0.45, transition: 'opacity 0.3s',
            pointerEvents: loggedIn ? 'all' : 'none',
          }}>
            <div style={{
              fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700,
              letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase',
              marginBottom: 16
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
                width: '100%', minHeight: 180,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)',
                fontFamily: 'var(--font-mono)', fontSize: 13,
                padding: '14px 16px', resize: 'vertical',
                marginBottom: 16, lineHeight: 1.6,
              }}
            />

            <div style={{ marginBottom: 16 }}>
              <FileUploader
                label="Resume (.pdf)"
                accept=".pdf"
                file={resumeFile}
                onFile={setResumeFile}
                icon="📄"
              />
            </div>

            {/* Analyse button */}
            <button
              onClick={handleAnalyse}
              disabled={!canAnalyse}
              style={BTN(
                canAnalyse ? 'var(--accent)' : 'var(--border)',
                canAnalyse ? '#fff' : 'var(--muted)',
                { width: '100%', marginBottom: 12 }
              )}
            >
              {status === 'Scoring your resume...' ? '⏳  Scoring...' : '▶  Analyse & Score'}
            </button>

            {/* Tailor button — always visible, grayed until ready */}
            <button
              onClick={handleTailor}
              disabled={!canTailor}
              style={BTN(
                canTailor ? 'var(--accent2)' : 'var(--border)',
                canTailor ? '#fff' : 'var(--muted)',
                { width: '100%' }
              )}
            >
              {status === 'Tailoring resume with Claude...' ? '⏳  Tailoring...' : '✦  Generate Tailored Resume'}
            </button>
          </div>
              <OutputPanel resumeFile={outputResume} coverFile={outputCover} />
        </div>
        {/* ════════════════ END LEFT COLUMN ════════════════ */}


        {/* ════════════════ RIGHT COLUMN ════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score Card — always visible, empty state until scored */}
          <ScoreCard original={originalScore} tailored={tailoredScore} />

          {/* Cover Letter button — always visible, grayed until ready */}
          {/* <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '24px 28px',
          }}>
            <div style={{
              fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700,
              letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase',
              marginBottom: 16
            }}>
              Step 3 — Cover Letter
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Available after tailored resume is generated.
            </p>
            <button
              onClick={handleCoverLetter}
              disabled={!canCover}
              style={BTN(
                canCover ? 'var(--green)' : 'var(--border)',
                canCover ? '#0d0f14' : 'var(--muted)',
                { width: '100%' }
              )}
            >
              {status === 'Writing cover letter...' ? '⏳  Writing...' : '✉  Generate Cover Letter'}
            </button>
          </div> */}

          {/* Output Files — always visible, empty until files exist */}
          {/* <OutputPanel resumeFile={outputResume} coverFile={outputCover} /> */}

        </div>
        {/* ════════════════ END RIGHT COLUMN ════════════════ */}

      </div>
    </div>
  )
}