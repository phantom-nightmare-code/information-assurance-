require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const MONGO_URI = process.env.MONGO_URI;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json());

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

let memoryProducts = [];
let useMemoryStore = false;

const validateProduct = (body) => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const quantity = Number(body.quantity);
  const price = Number(body.price);

  if (!name) return { error: 'Product name is required.' };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: 'Quantity must be a whole number of zero or more.' };
  if (!Number.isFinite(price) || price < 0) return { error: 'Price must be zero or more.' };

  return { value: { name, quantity, price } };
};

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: useMemoryStore ? 'memory' : 'mongodb',
  });
});

app.get('/api/products', async (_req, res) => {
  try {
    const products = useMemoryStore
      ? [...memoryProducts].sort((a, b) => b.updatedAt - a.updatedAt)
      : await Product.find().sort({ updatedAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load products.' });
  }
});

app.post('/api/products', async (req, res) => {
  const result = validateProduct(req.body);
  if (result.error) return res.status(400).json({ message: result.error });

  try {
    const product = useMemoryStore
      ? { _id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, ...result.value, createdAt: Date.now(), updatedAt: Date.now() }
      : await Product.create(result.value);

    if (useMemoryStore) memoryProducts.push(product);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to add product.' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const result = validateProduct(req.body);
  if (result.error) return res.status(400).json({ message: result.error });

  try {
    const product = useMemoryStore
      ? (() => {
          const index = memoryProducts.findIndex((item) => item._id === req.params.id);
          if (index === -1) return null;
          memoryProducts[index] = { ...memoryProducts[index], ...result.value, updatedAt: Date.now() };
          return memoryProducts[index];
        })()
      : await Product.findByIdAndUpdate(req.params.id, result.value, { new: true, runValidators: true });

    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Unable to update product.' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = useMemoryStore
      ? memoryProducts.find((item) => item._id === req.params.id)
      : await Product.findByIdAndDelete(req.params.id);

    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (useMemoryStore) memoryProducts = memoryProducts.filter((item) => item._id !== req.params.id);
    res.json({ message: 'Product has been deleted.' });
  } catch (error) {
    res.status(400).json({ message: 'Unable to delete product.' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

async function start() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      console.log('StockFlow database connected.');
    } catch (error) {
      console.warn(`MongoDB unavailable; using memory storage: ${error.message}`);
      useMemoryStore = true;
    }
  } else {
    console.warn('MONGO_URI is not set; using memory storage.');
    useMemoryStore = true;
  }

  app.listen(PORT, () => {
    console.log(`StockFlow backend running at http://localhost:${PORT}`);
  });
}

start();