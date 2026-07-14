const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Redirect any accidental requests for '/expense/dashboard' back to '/expense'
// This prevents it from falling back to your Notes login routes.
router.get('/dashboard', (req, res) => {
    res.redirect('/expense');
});

// GET: Render Expense Tracker Dashboard and calculate balances dynamically
router.get('/', async (req, res) => {
    try {
        // Fetch transactions from the database (sorted newest first)
        const transactions = await Transaction.find().sort({ date: -1 });

        // Dynamic Calculations
        let income = 0;
        let expense = 0;

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                income += transaction.amount;
            } else if (transaction.type === 'expense') {
                expense += transaction.amount;
            }
        });

        const totalBalance = income - expense;

        res.render('expense-dashboard', {
            title: 'Expense Tracker',
            transactions,
            income: income.toFixed(2),
            expense: expense.toFixed(2),
            totalBalance: totalBalance.toFixed(2)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database or Server Error');
    }
});

// POST: Add new Transaction
router.post('/add', async (req, res) => {
    try {
        const { description, amount, type } = req.body;

        await Transaction.create({
            description,
            amount: parseFloat(amount),
            type
        });

        res.redirect('/expense');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to add transaction');
    }
});

// POST: Delete Transaction
router.post('/delete/:id', async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.redirect('/expense');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to delete transaction');
    }
});

module.exports = router;