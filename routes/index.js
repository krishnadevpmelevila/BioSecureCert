const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { requireLogin } = require('../middlewares/auth');
const upload = multer({ dest: 'uploads/' });
const { Web3 } = require('web3');
const contractABI = require('../build/contracts/Certificate.json').abi; // Ensure ABI is in the correct path
const userABI = require('../build/contracts/UserManagement.json').abi; // Ensure ABI is in the correct path
const certContractAddress = '0x57702cE5164099672b528304610E9b83703e1fE9'; // Replace with your deployed contract address
const userManagementAddress = '0x8A090C2f74fa868B7Ece0a4834520Bde79315F51';
const web3 = new Web3('http://127.0.0.1:7545'); // Use Ganache local network
const Certificate = new web3.eth.Contract(contractABI, certContractAddress);
const UserManagement = new web3.eth.Contract(userABI, userManagementAddress);
// Home page route
router.get('/', requireLogin, (req, res) => {
  res.render('index', { title: 'BioSecureCert' });
});

// Login route
router.get('/login', (req, res) => {
  res.render('login', { layout: 'loginLayout' });
});

// Register route
router.get('/register', (req, res) => {
  res.render('register', { layout: 'loginLayout' });
});



// Helper function to get accounts
async function getAccounts() {
  return await web3.eth.getAccounts();
}

// Login POST handler
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const accounts = await getAccounts();
    const passwordHash = web3.utils.soliditySha3(password);

    const isValidUser = await UserManagement.methods
      .loginUser(username, passwordHash)
      .call({ from: accounts[0] });

    if (isValidUser) {
      req.session.issuerId = accounts[0];
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

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Register POST handler
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const accounts = await getAccounts();
    const passwordHash = web3.utils.soliditySha3(password);

    await UserManagement.methods
    .registerUser(username, passwordHash)
    .send({ from: accounts[0], gas: 5000000 });
  

    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Function to create a PDF
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
      });
    jumpLine(doc, 2);
    doc
      .font('Times-Roman')
      .fontSize(15)
      .fill('#021c27')
      .text('Presented to', {
        align: 'center',
      });
    jumpLine(doc, 1);
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fill('#021c27')
      .text(data['name'], {
        align: 'center',
      });
    jumpLine(doc, 1);
    doc
      .font('Times-Roman')
      .fontSize(15)
      .fill('#021c27')
      .text('by ' + data['authority'], {
        align: 'center',
      });
    jumpLine(doc, 2);
    doc
      .font('Times-Roman')
      .fontSize(15)
      .fill('#021c27')
      .text('For ' + data['event'], {
        align: 'center',
      });
    jumpLine(doc, 7);
    doc
      .font('Times-Roman')
      .fontSize(10)
      .fill('#021c27')
      .text('Unique ID: ' + uui, {
        align: 'center',
      });
    doc.end();

    stream.on('finish', function () {
      resolve();
    });

    stream.on('error', function (err) {
      reject(err);
    });
  });
}

// Generate certificate
router.post('/generate', requireLogin, async (req, res, next) => {
  try {
    var data = req.body;
    console.log(data);

    const uui = uuidv4();
    await createPDF(data, uui);
    const fileBuffer = fs.readFileSync('certificates/' + uui + '.pdf');
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const finalhash = hashSum.update(data['fingerprint']);
    const hex = finalhash.digest('hex');

    // Blockchain interaction
    const accounts = await web3.eth.getAccounts();
    await Certificate.methods.issueCertificate(
      uui,
      data['name'],
      data['email'],
      data['fingerprint'],
      data['authority'],
      data['role'],
      data['College'],
      data['Phone'],
      data['event'],
      data['comment'],
      hex
    ).send({ from: accounts[0] });

    res.redirect(`certificates/${uui}`);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('An error occurred while generating the certificate.');
  }
});

// Download certificate
router.get('/certificates/:id', requireLogin, function (req, res, next) {
  res.download(`certificates/` + req.params.id + `.pdf`);
});

// Verify certificate
router.get('/verify', requireLogin, async (req, res, next) => {
  res.render('verify', { success: 'success' });
});

router.post('/verify', requireLogin, upload.single('file'), async (req, res, next) => {
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const finalhash = hashSum.update(req.body.fingerprint);
    const hex = finalhash.digest('hex');

    // Blockchain interaction
    const isVerified = await Certificate.methods.verifyCertificate(req.body.uuid, hex, req.body.fingerprint).call();

    if (isVerified) {
      res.render('success', { layout: 'layoutA' });
    } else {
      res.render('verify', { error: 'Certificate not found' });
    }

    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Error:', err);
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('An error occurred while verifying the certificate.');
  }
});

// View certificates
router.get('/view', requireLogin, async (req, res, next) => {
  try {
    // Fetch certificates issued by the logged-in user from the blockchain
    const certs = await Certificate.methods.getCertificatesByIssuer(req.session.issuerId).call();
    console.log(certs);
    res.render('viewdata', { layout: 'layoutA', certs });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Revoke certificate
router.post('/revoke', async (req, res) => {
  const { certificateId } = req.body;
  try {
    // Blockchain interaction
    const accounts = await web3.eth.getAccounts();
    await Certificate.methods.revokeCertificate(certificateId).send({ from: accounts[0] });

    res.redirect('/view');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
