# Project Structure
```
resume-tailor/
│
├── backend/
│   ├── main.py                  ← FastAPI server
│   ├── claude_selenium.py       ← Your working selenium code, cleaned up
│   ├── resume_parser.py         ← PDF text extraction (pdfplumber)
│   ├── prompts/
│   │   ├── ResumeScoring.pmt    ← Your existing scoring prompt file
│   │   ├── ResumeTailor.pmt     ← Your existing tailor prompt file
│   │   └── CoverLetter.pmt      ← New cover letter prompt file
│   ├── .env                     ← Config (edge driver path, ports etc)
│   └── requirements.txt
│
├── generator/
│   ├── generate_resume.js       ← Reads resume_data.json, outputs .docx
│   ├── generate_cover.js        ← Reads cover_letter_data.json, outputs .docx
│   ├── resume_data.json         ← Written by backend, read by generator
│   ├── cover_letter_data.json   ← Written by backend, read by generator
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.jsx
│       └── components/
│           ├── FileUploader.jsx
│           ├── ScoreCard.jsx
│           └── OutputPanel.jsx
│
├── uploads/                     ← Uploaded PDFs land here (auto-created)
├── outputs/                     ← Generated .docx files land here (auto-created)
└── edge_profile_2/              ← Your existing Edge profile folder, move here
```