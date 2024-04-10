const PDFDocument = require('pdfkit');
const fs = require('fs');
const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
});
doc.pipe(fs.createWriteStream('output.pdf'));
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fff');

const distanceMargin = 18;
doc
    .fillAndStroke('#0e8cc3')
    .lineWidth(20)
    .lineJoin('round')
    .rect(
        distanceMargin,
        distanceMargin,
        doc.page.width - distanceMargin * 2,
        doc.page.height - distanceMargin * 2,
    )
    .stroke();
const maxWidth = 140;
const maxHeight = 70;
doc.image(
    'public/images/BioSecureCert.png',
    doc.page.width / 2 - maxWidth / 2,
    60,
    {
        fit: [maxWidth, maxHeight],
        align: 'center',
    }
);
function jumpLine(doc, lines) {
    for (let index = 0; index < lines; index++) {
        doc.moveDown();
    }
}
jumpLine(doc, 7);
doc
    .font('Times-Roman')
    .fontSize(20)
    .fill('#021c27')
    .text('CERTIFICATE FOR PARTTICIPATION', {
        align: 'center',
    }
    );
jumpLine(doc, 2);
doc
    .font('Times-Roman')
    .fontSize(15)
    .fill('#021c27')
    .text('Presented to', {
        align: 'center',
    }
    );
jumpLine(doc, 1);
doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fill('#021c27')
    .text('John Doe', {
        align: 'center',
    }
    );
jumpLine(doc, 1);
doc
    .font('Times-Roman')
    .fontSize(15)
    .fill('#021c27')
    .text('by NCIIPC', {
        align: 'center',
    }
    );
jumpLine(doc, 2);
doc
    .font('Times-Roman')
    .fontSize(15)
    .fill('#021c27')
    .text('For Pentathon 24', {
        align: 'center',
    }
    );
jumpLine(doc, 7);
doc
    .font('Times-Roman')
    .fontSize(10)
    .fill('#021c27')
    .text('Unique ID: e5e0dbdb-73c8-4ee6-8fa4-776db5baefb0', {
        align: 'center',
    }
    );
doc.end();