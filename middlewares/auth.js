// middleware.js
const requireLogin = (req, res, next) => {
    if (!req.session.issuerId) {
        return res.redirect('/login');
    }
    res.locals.isLoggedIn = true; // Set isLoggedIn to true in local variables
    next();
};

module.exports = { requireLogin };
