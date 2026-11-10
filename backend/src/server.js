require('dotenv').config();
if(!process.env.DATABASE_URL || !process.env.JWT_SECRET){console.error('DATABASE_URL dan JWT_SECRET wajib diatur di file .env');process.exit(1);}
const app=require('./app');
const port=process.env.PORT || 3000;
app.listen(port,()=>console.log(`SIMKRS API berjalan di http://localhost:${port}`));
