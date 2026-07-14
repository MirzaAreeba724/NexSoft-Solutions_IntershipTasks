// routes/ecommerce.js
const express = require('express');
const router = express.Router();
const ShopUser = require('../models/ShopUser');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { ensureShopUser, ensureShopAdmin, injectShopUser } = require('../middleware/shopAuth');

router.use(injectShopUser);

// 1. Authentication Handlers
router.get('/login', (req, res) => {
    if (req.session.shopUserId) return res.redirect('/ecommerce');
    res.render('shop-auth', { error: null });
});

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.render('shop-auth', { error: 'All fields are required.' });
        }
        const existing = await ShopUser.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.render('shop-auth', { error: 'An account with this email is already registered.' });
        }
        const newUser = new ShopUser({ name, email, password });
        await newUser.save();
        req.session.shopUserId = newUser._id;
        return res.redirect('/ecommerce');
    } catch (err) {
        console.error("CRITICAL REGISTER ERROR:", err);
        return res.render('shop-auth', { error: `Database Error: ${err.message}` });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.render('shop-auth', { error: 'All fields are required.' });
        }

        let user = await ShopUser.findOne({ email: email.toLowerCase() });

        // FOOLPROOF ADMIN INITIALIZER:
        // If the user attempts to log in as admin@nexsoft.com / adminpassword123, 
        // we automatically create or promote the account on the fly.
        if (email.toLowerCase() === 'admin@nexsoft.com' && password === 'adminpassword123') {
            if (!user) {
                user = new ShopUser({
                    name: "Shop Administrator",
                    email: "admin@nexsoft.com",
                    password: "adminpassword123",
                    role: "admin"
                });
                await user.save();
            } else if (user.role !== 'admin') {
                user.role = 'admin';
                await user.save();
            }
        }

        if (!user || !(await user.comparePassword(password))) {
            return res.render('shop-auth', { error: 'Invalid email or password.' });
        }

        req.session.shopUserId = user._id;
        return res.redirect('/ecommerce');
    } catch (err) {
        console.error("CRITICAL LOGIN ERROR:", err);
        return res.render('shop-auth', { error: `Login Error: ${err.message}` });
    }
});

router.get('/logout', (req, res) => {
    delete req.session.shopUserId;
    res.redirect('/ecommerce');
});

// 2. Public Catalog Front-page
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.render('shop-list', { products });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error reading catalog.");
    }
});

// 3. Cart Management
router.get('/cart', ensureShopUser, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.shopUser._id }).populate('items.productId');
        if (!cart) {
            cart = new Cart({ userId: req.shopUser._id, items: [] });
            await cart.save();
        }
        res.render('shop-cart', { cart });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error rendering cart.");
    }
});

router.post('/cart/add', ensureShopUser, async (req, res) => {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10) || 1;
    try {
        const product = await Product.findById(productId);
        if (!product || product.stock < qty) {
            return res.status(400).send("Insufficient product inventory.");
        }
        let cart = await Cart.findOne({ userId: req.shopUser._id });
        if (!cart) {
            cart = new Cart({ userId: req.shopUser._id, items: [] });
        }
        const idx = cart.items.findIndex(i => i.productId.toString() === productId);
        if (idx > -1) {
            cart.items[idx].quantity += qty;
        } else {
            cart.items.push({ productId, quantity: qty });
        }
        await cart.save();
        res.redirect('/ecommerce/cart');
    } catch (err) {
        console.error(err);
        res.status(500).send("Add-to-cart operation failed.");
    }
});

router.post('/cart/remove', ensureShopUser, async (req, res) => {
    const { productId } = req.body;
    try {
        const cart = await Cart.findOne({ userId: req.shopUser._id });
        if (cart) {
            cart.items = cart.items.filter(i => i.productId.toString() !== productId);
            await cart.save();
        }
        res.redirect('/ecommerce/cart');
    } catch (err) {
        console.error(err);
        res.status(500).send("Removal from cart failed.");
    }
});

router.post('/checkout', ensureShopUser, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.shopUser._id }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).send("Your cart is empty.");
        }

        const orderItems = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const prod = item.productId;
            if (!prod || prod.stock < item.quantity) {
                return res.status(400).send(`Unable to checkout. ${prod ? prod.name : 'Product'} is out of stock.`);
            }
            orderItems.push({
                productId: prod._id,
                name: prod.name,
                price: prod.price,
                quantity: item.quantity
            });
            totalAmount += prod.price * item.quantity;
        }

        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: -item.quantity } });
        }

        const order = new Order({ userId: req.shopUser._id, items: orderItems, totalAmount });
        await order.save();

        cart.items = [];
        await cart.save();

        res.send(`Order recorded successfully! Invoice reference ID: ${order._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Checkout transaction could not be executed.");
    }
});

// 4. Admin Portal Access
router.get('/admin', ensureShopAdmin, async (req, res) => {
    try {
        const products = await Product.find({});
        const orders = await Order.find({}).populate('userId');
        res.render('shop-admin', { products, orders });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed accessing administrative directory.");
    }
});

router.post('/admin/product/add', ensureShopAdmin, async (req, res) => {
    const { name, description, price, stock, image } = req.body;
    try {
        const prod = new Product({
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            image: image || undefined
        });
        await prod.save();
        res.redirect('/ecommerce/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to publish product.");
    }
});

router.post('/admin/product/delete/:id', ensureShopAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/ecommerce/admin');
    } catch (err) {
        console.error("Product deletion failed:", err);
        res.status(500).send("Failed to delete product.");
    }
});

module.exports = router;