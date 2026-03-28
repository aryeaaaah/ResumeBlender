import React from 'react'

function OutputFile({ label, filename, downloadUrl, icon }) {
  if (!filename) return null
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 11, color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3
        }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: 'var(--green)' }}>{filename}</div>
      </div>
       <a  
        href={downloadUrl}
        download={filename}
        style={{
          background: 'var(--accent)', color: '#fff',
          borderRadius: 8, padding: '8px 18px', fontSize: 12,
          fontFamily: 'var(--font-mono)', textDecoration: 'none',
          fontWeight: 500, letterSpacing: 0.5,
          transition: 'opacity 0.2s',
        }}
      >
        Download
      </a>
    </div>
  )
}

export default function OutputPanel({ resumeFile, coverFile }) {
  // if (!resumeFile && !coverFile) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '24px 28px', marginTop: 0,
    }}>
      <div style={{
        fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700,
        letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase',
        marginBottom: 16
      }}>
        Output Files
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OutputFile
          label="Tailored Resume"
          filename={resumeFile?.name}
          downloadUrl={resumeFile?.url}
          icon="📄"
        />
        <OutputFile
          label="Cover Letter"
          filename={coverFile?.name}
          downloadUrl={coverFile?.url}
          icon="✉️"
        />
      </div>
    </div>
  )
}