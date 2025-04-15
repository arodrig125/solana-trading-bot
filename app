const path = require('path');

// Serve static files from 'public' or 'website/public'
app.use(express.static(path.join(__dirname, 'public')));
// OR if your files are in website/public:
app.use(express.static(path.join(__dirname, 'website/public')));