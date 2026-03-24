const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  LevelFormat, BorderStyle, TabStopType
} = require('docx');
const fs   = require('fs');
const path = require('path');

const data       = JSON.parse(fs.readFileSync(path.join(__dirname, 'resume_data.json'), 'utf8'));
const outputPath = process.argv[2] || path.join(__dirname, '../outputs/tailored_resume.docx');

const DARK   = "1A1A2E";
const ACCENT = "1B4F8A";
const GRAY   = "555555";

function sectionHeader(text) {
  return new Paragraph({
    spacing: { before: 140, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 19, color: ACCENT, font: "Arial" })]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 25, after: 25 },
    children: [new TextRun({ text, size: 18, font: "Arial", color: DARK })]
  });
}

function jobTitle(role, company, location, dates) {
  return new Paragraph({
    spacing: { before: 100, after: 25 },
    tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
    children: [
      new TextRun({ text: role, bold: true, size: 19, font: "Arial", color: DARK }),
      new TextRun({ text: " | " + company, size: 19, font: "Arial", color: ACCENT, bold: true }),
      new TextRun({ text: " | " + location, size: 18, font: "Arial", color: GRAY }),
      new TextRun({ text: "\t" + dates, size: 18, font: "Arial", color: GRAY, italics: true }),
    ]
  });
}

function projectTitle(name, tech) {
  return [
    new Paragraph({
      spacing: { before: 100, after: 10 },
      children: [new TextRun({ text: name, bold: true, size: 19, font: "Arial", color: DARK })]
    }),
    new Paragraph({
      spacing: { before: 0, after: 25 },
      children: [new TextRun({ text: tech, size: 16, font: "Arial", color: GRAY, italics: true })]
    }),
  ];
}

function skillRow(label, value) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: label + ": ", bold: true, size: 20, font: "Arial", color: DARK }),
      new TextRun({ text: value, size: 20, font: "Arial", color: DARK }),
    ]
  });
}

function eduLine(degree, school, location, date) {
  return new Paragraph({
    spacing: { before: 80, after: 40 },
    tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
    children: [
      new TextRun({ text: degree, bold: true, size: 20, font: "Arial", color: DARK }),
      new TextRun({ text: " | " + school + " | " + location, size: 20, font: "Arial", color: GRAY }),
      new TextRun({ text: "\t" + date, size: 20, font: "Arial", color: GRAY, italics: true }),
    ]
  });
}

const children = [];

// Header
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 },
  children: [new TextRun({ text: data.name, bold: true, size: 40, font: "Arial", color: DARK })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 },
  children: [new TextRun({ text: data.tagline, size: 17, font: "Arial", color: ACCENT })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
  children: [new TextRun({
    text: `${data.phone}  |  ${data.email}  |  ${data.linkedin}  |  ${data.portfolio}`,
    size: 17, font: "Arial", color: GRAY
  })]
}));

// Profile
children.push(sectionHeader("Profile"));
children.push(new Paragraph({
  spacing: { before: 50, after: 30 },
  children: [new TextRun({ text: data.profile, size: 17, font: "Arial", color: DARK })]
}));

// Skills
children.push(sectionHeader("Technical Skills"));
for (const [label, value] of Object.entries(data.skills || {})) {
  children.push(skillRow(label, value));
}

// Experience
children.push(sectionHeader("Experience"));
for (const exp of (data.experience || [])) {
  children.push(jobTitle(exp.role, exp.company, exp.location, exp.dates));
  for (const b of (exp.bullets || [])) children.push(bullet(b));
}

// Projects
children.push(sectionHeader("Projects"));
for (const proj of (data.projects || [])) {
  children.push(...projectTitle(proj.name, proj.tech));
  for (const b of (proj.bullets || [])) children.push(bullet(b));
}

// Education
children.push(sectionHeader("Education"));
for (const edu of (data.education || [])) {
  children.push(eduLine(edu.degree, edu.school, edu.location, edu.date));
  if (edu.note) {
    children.push(new Paragraph({
      spacing: { before: 10, after: 20 },
      children: [new TextRun({ text: edu.note, size: 16, font: "Arial", color: GRAY, italics: true })]
    }));
  }
}

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "•",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 280 } } }
      }]
    }]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 500, right: 800, bottom: 500, left: 800 }
      }
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Resume generated:", outputPath);
});