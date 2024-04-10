var express = require('express');
var router = express.Router();
var path = require('path');
const { v4: uuidv4 } = require('uuid');
const Cert = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const crypto = require('crypto');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

async function createPDF(data, uui) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    });
    const stream = doc.pipe(fs.createWriteStream(`certificates/${uui}.pdf`));

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
      .text('CERTIFICATE FOR ' + data['role'], {
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
      .text(data['name'], {
        align: 'center',
      }
      );
    jumpLine(doc, 1);
    doc
      .font('Times-Roman')
      .fontSize(15)
      .fill('#021c27')
      .text('by ' + data['authority'], {
        align: 'center',
      }
      );
    jumpLine(doc, 2);
    doc
      .font('Times-Roman')
      .fontSize(15)
      .fill('#021c27')
      .text('For ' + data['event'], {
        align: 'center',
      }
      );
    jumpLine(doc, 7);
    doc
      .font('Times-Roman')
      .fontSize(10)
      .fill('#021c27')
      .text('Unique ID: ' + uui, {
        align: 'center',
      }
      );
    doc.end();

    stream.on('finish', function () {
      resolve();
    });

    stream.on('error', function (err) {
      reject(err);
    });
  })
}

router.post('/generate', async (req, res, next) => {
  try {
    var data = req.body;
    console.log(data);

    uui = uuidv4();
    await createPDF(data, uui);
    const fileBuffer = fs.readFileSync('certificates/' + uui + '.pdf')
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    finalhash=hashSum.update(data['fingerprint']);
    const hex = hashSum.digest('hex');
 
    const newCert = new Cert({
      name: data['name'],
      email: data['email'],
      fingerprint: data['fingerprint'],
      authority: data['authority'],
      certificateType: data['role'],
      College: data['College'],
      Phone: data['Phone'],
      event: data['event'],
      comment: data['comment'],
      hash: hex,
      uuid: uui
    });
    await newCert.save();
    res.redirect(`certificates/${uui}`)
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('An error occurred while generating the certificate.');
  }
});
router.get('/certificates/:id', function (req, res, next) {
  res.download(`certificates/` + req.params.id + `.pdf`);
});

module.exports = router;
