const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  LevelFormat, BorderStyle, TabStopType
} = require('docx');
const fs = require('fs');
const path = require('path');

// Read resume data from JSON file
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'resume_data.json'), 'utf8'));
const outputPath = process.argv[2] || path.join(__dirname, '../outputs/tailored_resume.docx');

// Color scheme matching your resume
const DARK = "1A1A2E";     // Dark text
const ACCENT = "1B4F8A";   // Blue accent
const GRAY = "555555";     // Gray for secondary text

// ── Helper Functions ──────────────────────────────────────────────────────

function sectionHeader(text) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 2 } },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,  // 11pt
        color: ACCENT,
        font: "Arial"
      })
    ]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({
        text,
        size: 22,  // 11pt
        font: "Arial",
        color: DARK
      })
    ]
  });
}

function jobTitle(role, company, location, dates) {
  return new Paragraph({
    spacing: { before: 120, after: 40 },
    tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
    children: [
      new TextRun({
        text: role,
        bold: true,
        size: 22,  // 11pt
        font: "Arial",
        color: DARK
      }),
      new TextRun({
        text: " | " + company,
        size: 22,
        font: "Arial",
        color: ACCENT,
        bold: true
      }),
      new TextRun({
        text: " | " + location,
        size: 21,  // 10.5pt
        font: "Arial",
        color: GRAY
      }),
      new TextRun({
        text: "\t" + dates,
        size: 21,
        font: "Arial",
        color: GRAY,
        italics: true
      })
    ]
  });
}

function projectTitle(name, tech) {
  return [
    new Paragraph({
      spacing: { before: 120, after: 20 },
      children: [
        new TextRun({
          text: name,
          bold: true,
          size: 22,  // 11pt
          font: "Arial",
          color: DARK
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: tech,
          size: 20,  // 10pt
          font: "Arial",
          color: GRAY,
          italics: true
        })
      ]
    })
  ];
}

function skillRow(label, value) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text: label + ": ",
        bold: true,
        size: 22,  // 11pt
        font: "Arial",
        color: DARK
      }),
      new TextRun({
        text: value,
        size: 22,
        font: "Arial",
        color: DARK
      })
    ]
  });
}

function eduLine(degree, school, location, date) {
  return new Paragraph({
    spacing: { before: 100, after: 60 },
    tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
    children: [
      new TextRun({
        text: degree,
        bold: true,
        size: 22,  // 11pt
        font: "Arial",
        color: DARK
      }),
      new TextRun({
        text: " | " + school + " | " + location,
        size: 22,
        font: "Arial",
        color: GRAY
      }),
      new TextRun({
        text: "\t" + date,
        size: 22,
        font: "Arial",
        color: GRAY,
        italics: true
      })
    ]
  });
}

function contactInfo(phone, email, linkedin, portfolio) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [
      new TextRun({
        text: `${phone}  |  ${email}  |  ${linkedin}  |  ${portfolio}`,
        size: 20,  // 10pt
        font: "Arial",
        color: GRAY
      })
    ]
  });
}

// ── Build Document ────────────────────────────────────────────────────────

const children = [];

// Header: Name
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 20 },
  children: [
    new TextRun({
      text: data.name,
      bold: true,
      size: 48,  // 24pt
      font: "Arial",
      color: DARK
    })
  ]
}));

// Header: Tagline/Title
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 20 },
  children: [
    new TextRun({
      text: data.tagline,
      size: 20,  // 10pt
      font: "Arial",
      color: ACCENT
    })
  ]
}));

// Header: Contact Info
children.push(contactInfo(data.phone, data.email, data.linkedin, data.portfolio));

// Profile Section
children.push(sectionHeader("Profile"));
children.push(new Paragraph({
  spacing: { before: 80, after: 100 },
  alignment: AlignmentType.LEFT,
  children: [
    new TextRun({
      text: data.profile,
      size: 20,  // 10pt
      font: "Arial",
      color: DARK,
      italics: false
    })
  ]
}));

// Skills Section
if (data.skills && Object.keys(data.skills).length > 0) {
  children.push(sectionHeader("Technical Skills"));
  for (const [label, value] of Object.entries(data.skills)) {
    children.push(skillRow(label, value));
  }
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun("")] }));
}

// Experience Section
if (data.experience && data.experience.length > 0) {
  children.push(sectionHeader("Experience"));
  for (const exp of data.experience) {
    children.push(jobTitle(exp.role, exp.company, exp.location, exp.dates));
    if (exp.bullets && exp.bullets.length > 0) {
      for (const b of exp.bullets) {
        children.push(bullet(b));
      }
    }
  }
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun("")] }));
}

// Projects Section
if (data.projects && data.projects.length > 0) {
  children.push(sectionHeader("Projects"));
  for (const proj of data.projects) {
    children.push(...projectTitle(proj.name, proj.tech));
    if (proj.bullets && proj.bullets.length > 0) {
      for (const b of proj.bullets) {
        children.push(bullet(b));
      }
    }
  }
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun("")] }));
}

// Education Section
if (data.education && data.education.length > 0) {
  children.push(sectionHeader("Education"));
  for (const edu of data.education) {
    children.push(eduLine(edu.degree, edu.school, edu.location, edu.date));
    if (edu.note) {
      children.push(new Paragraph({
        spacing: { before: 20, after: 80 },
        children: [
          new TextRun({
            text: edu.note,
            size: 19,  // 9.5pt
            font: "Arial",
            color: GRAY,
            italics: true
          })
        ]
      }));
    }
  }
}

// ── Create Document ──────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 480, hanging: 280 }
              }
            }
          }
        ]
      }
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: {
            width: 11906,   // A4 width in DXA
            height: 16838   // A4 height in DXA
          },
          margin: {
            top: 720,      // 0.5 inch
            right: 720,    // 0.5 inch
            bottom: 720,   // 0.5 inch
            left: 720      // 0.5 inch
          }
        }
      },
      children
    }
  ]
});

// Write the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("✓ Resume generated:", outputPath);
}).catch(err => {
  console.error("Error generating resume:", err);
  process.exit(1);
});