const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
 
const app = express();
app.use(cors());
app.use(express.json());
 
// ---> YOUR ATLAS CONNECTION STRING <---
const MONGO_URI = 'mongodb+srv://jamesadriancastro123_db_user:James123@cluster0.jkforvz.mongodb.net/stockflowDB?retryWrites=true&w=majority';
 
mongoose.connect(MONGO_URI)
  .then(() => console.log('StockFlow Database Connected Successfully'))
  .catch(err => console.log('MongoDB Connection Error: ', err));
 
// Create a Schema for Products
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});
 
const Product = mongoose.model('Product', productSchema);
 
// --- CRUD ROUTES ---
 
// 1. CREATE (POST)
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});
 
// 2. READ (GET)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});
 
// 3. UPDATE (PUT)
app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});
 
// 4. DELETE (DELETE)
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product has been deleted' });
  } catch (err) {
    res.status(500).json(err);
  }
});
 
// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`StockFlow Backend is running on port ${PORT}`);
});