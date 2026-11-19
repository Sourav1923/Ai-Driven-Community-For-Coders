const express = require('express');
const router = express.Router();

// In-memory data store (replace with a database in a real application)
let items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
];
let nextId = 3;

// GET all items
router.get('/items', (req, res) => {
  res.json(items);
});

// GET a specific item by ID
router.get('/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const item = items.find(item => item.id === itemId);

  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  res.json(item);
});

// POST a new item
router.post('/items', (req, res) => {
  const newItem = {
    id: nextId++,
    name: req.body.name,
  };

  items.push(newItem);
  res.status(201).json(newItem);
});

// PUT (update) an existing item
router.put('/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const itemIndex = items.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found' });
  }

  items[itemIndex] = {
    id: itemId,
    name: req.body.name,
  };

  res.json(items[itemIndex]);
});

// DELETE an item
router.delete('/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  items = items.filter(item => item.id !== itemId);
  res.status(204).send(); // No content
});

module.exports = router;