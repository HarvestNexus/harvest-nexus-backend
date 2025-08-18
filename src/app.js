const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const cors =require('cors');
app.use(cors());
app.use(express.json());

app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use("/api/signUp", require("./routes/signUpRoutes") )

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`);
});
