const express = require('express');
const router = express.Router();
const CashRequest = require('../models/CashRequest');

// Get all cash requests
router.get('/', async (req, res) => {
    try {
        // Only return non-deleted requests by default
        const showDeleted = req.query.showDeleted === 'true';
        const filter = showDeleted ? {} : { deleted: false };
        const requests = await CashRequest.find(filter).populate('requester', 'name department');
        res.json({ status: 'success', requests });
    } catch (error) {
        console.error('Error fetching cash requests:', error);
        res.status(500).json({ status: 'error', message: 'Error fetching requests', error: error.message });
    }
});

// New: Get all requests including deleted (for statistics/history)
router.get('/history', async (req, res) => {
    try {
        const requests = await CashRequest.find({}).populate('requester', 'name department');
        res.json({ status: 'success', requests });
    } catch (error) {
        console.error('Error fetching cash request history:', error);
        res.status(500).json({ status: 'error', message: 'Error fetching request history', error: error.message });
    }
});

// Create a new cash request
router.post('/', async (req, res) => {
    try {
        const { requesterId, amount, reason } = req.body;
        if (!requesterId || !amount) {
            return res.status(400).json({ status: 'error', message: 'Requester ID and amount are required' });
        }

        const newRequest = new CashRequest({
            requester: requesterId,
            amount,
            reason
        });
        await newRequest.save();
        res.status(201).json({ status: 'success', message: 'Request created', request: newRequest });
    } catch (error) {
        console.error('Error creating cash request:', error);
        res.status(500).json({ status: 'error', message: 'Error creating request', error: error.message });
    }
});

// Delete a cash request
router.delete('/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        // Soft delete: set deleted: true
        const deletedRequest = await CashRequest.findByIdAndUpdate(requestId, { deleted: true }, { new: true });

        if (!deletedRequest) {
            return res.status(404).json({ status: 'error', message: 'Request not found' });
        }

        res.json({ status: 'success', message: 'Request deleted (soft delete) successfully' });
    } catch (error) {
        console.error('Error deleting cash request:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'error', message: 'Invalid request ID format' });
        }
        res.status(500).json({ status: 'error', message: 'Error deleting request', error: error.message });
    }
});

// Get a single cash request
router.get('/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const request = await CashRequest.findById(requestId).populate('requester connectedTo', 'name department');
        
        if (!request) {
            return res.status(404).json({ status: 'error', message: 'Request not found' });
        }

        res.json({ status: 'success', request });
    } catch (error) {
        console.error('Error fetching cash request:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'error', message: 'Invalid request ID format' });
        }
        res.status(500).json({ status: 'error', message: 'Error fetching request', error: error.message });
    }
});

module.exports = router; 