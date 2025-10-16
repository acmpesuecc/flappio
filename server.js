
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'Frontend')));
app.use('/Sprites', express.static(path.join(__dirname, 'Sprites')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

app.get('/leaderboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'leaderboard.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


