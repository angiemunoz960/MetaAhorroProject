const express = requirw ('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express)

app.get ('/registros', (req, res) => {
    res.json(registros)
});
