const {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle
} = require('docx');
const fs   = require('fs');
const path = require('path');

const data       = JSON.parse(fs.readFileSync(path.join(__dirname, 'cover_letter_data.json'), 'utf8'));
const outputPath = process.argv[2] || path.join(__dirname, '../outputs/cover_letter.docx');

const DARK   = "1A1A2E";
const ACCENT = "1B4F8A";
const GRAY   = "555555";

const children = [];

// Date
children.push(new Paragraph({
  spacing: { before: 0, after: 40 },
  children: [new TextRun({
    text: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    size: 18, font: "Arial", color: GRAY, italics: true
  })]
}));

// Recipient
children.push(new Paragraph({
  spacing: { before: 40, after: 10 },
  children: [new TextRun({ text: data.recipient, bold: true, size: 20, font: "Arial", color: DARK })]
}));
children.push(new Paragraph({
  spacing: { before: 0, after: 60 },
  children: [new TextRun({ text: data.company, size: 20, font: "Arial", color: ACCENT })]
}));

// Subject line
children.push(new Paragraph({
  spacing: { before: 0, after: 60 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
  children: [new TextRun({
    text: `Re: Application for ${data.role}`,
    bold: true, size: 22, font: "Arial", color: DARK
  })]
}));

// Paragraphs
for (const para of (data.paragraphs || [])) {
  children.push(new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: para, size: 19, font: "Arial", color: DARK })]
  }));
}

// Sign off
children.push(new Paragraph({
  spacing: { before: 80, after: 20 },
  children: [new TextRun({ text: "Yours sincerely,", size: 19, font: "Arial", color: DARK })]
}));
children.push(new Paragraph({
  spacing: { before: 60, after: 0 },
  children: [new TextRun({ text: data.name || "Alan Arimpur Raju", bold: true, size: 20, font: "Arial", color: DARK })]
}));

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 800, right: 1000, bottom: 800, left: 1000 }
      }
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Cover letter generated:", outputPath);
});