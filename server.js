const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Clean URL routes
const routes = {
  '/': 'index.html',
  '/foot': 'index.html',
  '/body': 'body.html',
  '/cart': 'cart.html'
};

Object.entries(routes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
});

// Fallback for any .html-less path
app.get('*', (req, res) => {
  const maybe = path.join(__dirname, req.path + '.html');
  res.sendFile(maybe, err => {
    if (err) res.status(404).sendFile(path.join(__dirname, 'index.html'));
  });
});

app.listen(PORT, () => console.log(`Relivastep live on port ${PORT}`));
