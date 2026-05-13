const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory (where HTML, CSS, JS, images are)
app.use(express.static(path.join(__dirname)));

// For any other route, send the index.html (optional, for direct access to pages)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`relivastep server running on port ${PORT}`);
});
