var express = require('express');
var router = express.Router();
var path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Cert = require('../db');
const Issuer = require('../issuerdb');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { requireLogin } = require('../middlewares/auth');
const upload = multer({ dest: 'uploads/' });
/* GET home page. */
router.get('/', requireLogin, function (req, res, next) {
  res.render('index', { title: 'BioSecureCert' });
});

router.get('/login', (req, res) => {
  res.render('login', { layout: 'loginLayout' });
});
router.get('/register', (req, res) => {
  res.render('register', { layout: 'loginLayout' });
});
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const issuer = await Issuer.findOne({ username });
    if (issuer && await bcrypt.compare(password, issuer.password)) {
      req.session.issuerId = issuer._id;
      console.log(req.session);
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if the username already exists
    const existingIssuer = await Issuer.findOne({ username });
    if (existingIssuer) {
      return res.status(400).send('Username already exists');
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new issuer
    const newIssuer = new Issuer({
      username,
      password: hashedPassword
    });
    he = await newIssuer.save();
    console.log(he);
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
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

router.post('/generate', requireLogin, async (req, res, next) => {
  try {
    var data = req.body;
    console.log(data);

    uui = uuidv4();
    await createPDF(data, uui);
    const fileBuffer = fs.readFileSync('certificates/' + uui + '.pdf')
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    finalhash = hashSum.update(data['fingerprint']);
    const hex = finalhash.digest('hex');
    // if already present in db show error
    const cert = await Cert.findOne({ hash: hex });
    if (cert) {
      return res.render('verify', { fail: 'Certificate already exists' });
    }

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
      uuid: uui,
      issuer: req.session.issuerId
    });
    await newCert.save();
    res.redirect(`certificates/${uui}`)
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('An error occurred while generating the certificate.');
  }
});
router.get('/certificates/:id', requireLogin, function (req, res, next) {
  res.download(`certificates/` + req.params.id + `.pdf`);
});
router.get('/verify', requireLogin, async (req, res, next) => {
  res.render('verify', { success: 'success' });
});
router.post('/verify', requireLogin, upload.single('file'), async (req, res, next) => {

  // check the file hash

  const fileBuffer = fs.readFileSync(req.file.path)
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  finalhash = hashSum.update(req.body.fingerprint);
  const hex = finalhash.digest('hex');

  // check the fingerprint
  const fingerprint = req.body.fingerprint;
  console.log(hex, fingerprint);
  const cert = await Cert.findOne({ hash: hex, fingerprint: fingerprint });
  if (cert) {

    data = [{
      uuid: cert.uuid,
      nam: cert.name,
      issuer: cert.issuer,
      authority: cert.authority,
      role: cert.certificateType,
      email: cert.email,
      College: cert.College,
      Phone: cert.Phone,
      comment: cert.comment,
      even: cert.event
    }];
    console.log(data);
    res.render('success', { layout: 'layoutA', data });
    // delete upload
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Error: ', err);
      }
    });

  } else {
    res.render('verify', { error: 'Certificate not found' });
    // delete upload
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Error:', err);
      }
    });
  }

})
router.get('/view', requireLogin, async (req, res, next) => {
  const cert = await Cert.find({ issuer: req.session.issuerId });
  console.log(cert);




  res.render('viewdata', { layout: 'layoutA', cert });
});
router.post('/revoke', async (req, res) => {
  const { certificateId } = req.body;
  try {
    // Find the certificate by ID
    const certificate = await Cert.findById(certificateId);
    if (!certificate) {
      return res.status(404).send('Certificate not found');
    }
    // Check if the issuer ID matches the logged-in issuer ID
    if (certificate.issuer.toString() === req.session.issuerId) {
      // Perform the revocation action here
      // For example, you can update the certificate status or delete it
      // Here, let's just delete the certificate
      await certificate.deleteOne();
      return res.redirect('/view');
    } else {
      return res.status(403).send('You are not authorized to revoke this certificate');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
