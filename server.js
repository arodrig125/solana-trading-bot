const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for any routes that don't match a static file
app.get('*', (req, res) => {
  // Check if the request is for a specific file extension
  const fileExtension = path.extname(req.path);
  if (fileExtension) {
    // If it's a file request that wasn't found in the static directory, return 404
    return res.status(404).send('File not found');
  }
  
  // Otherwise, serve the index.html file (for SPA-like behavior)
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
