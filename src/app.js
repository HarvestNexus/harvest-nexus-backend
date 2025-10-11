require('./config/db')
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const cors =require('cors');
app.use(cors());
app.use(express.json());

const UserRouter = require('./routes/User')
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/user', UserRouter);
const PORT = process.env.PORT || 5001;
app.listen(PORT);
