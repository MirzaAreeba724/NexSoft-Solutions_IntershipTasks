// middleware/shopAuth.js

const ShopUser = require('../models/ShopUser');

module.exports = {
    ensureShopUser: async (req, res, next) => {
        if (!req.session || !req.session.shopUserId) {
            // Must redirect to /ecommerce/login
            return res.redirect('/ecommerce/login');
        }
        try {
            const user = await ShopUser.findById(req.session.shopUserId);
            if (!user) {
                delete req.session.shopUserId;
                return res.redirect('/ecommerce/login');
            }
            req.shopUser = user;
            res.locals.shopUser = user;
            next();
        } catch (err) {
            console.error(err);
            res.status(500).send("Authentication System Error");
        }
    },

    ensureShopAdmin: async (req, res, next) => {
        if (!req.session || !req.session.shopUserId) {
            return res.redirect('/ecommerce/login');
        }
        try {
            const user = await ShopUser.findById(req.session.shopUserId);
            if (!user || user.role !== 'admin') {
                return res.status(403).send("Forbidden: Administrative Access Required.");
            }
            req.shopUser = user;
            res.locals.shopUser = user;
            next();
        } catch (err) {
            console.error(err);
            res.status(500).send("Administrative Verification Error");
        }
    },

    injectShopUser: async (req, res, next) => {
        if (req.session && req.session.shopUserId) {
            try {
                const user = await ShopUser.findById(req.session.shopUserId);
                if (user) {
                    req.shopUser = user;
                    res.locals.shopUser = user;
                }
            } catch (err) {
                console.error(err);
            }
        }
        next();
    }
};