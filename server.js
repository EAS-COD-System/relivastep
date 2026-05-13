const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the project root
app.use(express.static(path.join(__dirname)));

// Custom route mapping – clean URLs without .html
const routes = {
  '/': 'index.html',
  '/foot': 'index.html',
  '/body': 'body.html',
  '/cart': 'cart.html'
};

// Handle each route
Object.entries(routes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
});

// For any other request that doesn't match a file, try adding .html
app.get('*', (req, res) => {
  const maybePath = path.join(__dirname, req.path + '.html');
  res.sendFile(maybePath, err => {
    if (err) {
      // If not found, send 404 (or redirect to index)
      res.status(404).sendFile(path.join(__dirname, 'index.html'));
    }
  });
});

app.listen(PORT, () => {
  console.log(`relivastep server running on port ${PORT}`);
});
