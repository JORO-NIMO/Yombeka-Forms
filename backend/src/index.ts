import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import formsRoutes from './routes/forms';
import { prisma } from './prisma';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);

app.get('/', (req: any, res: any) => {
  res.json({ ok: true });
});

// Simple endpoint to list forms for current user (owner) - developer note: used by frontend scaffold
app.get('/api/forms', async (req: any, res: any) => {
  // naive: return all forms (filtering would be added with auth)
  const forms = await prisma.form.findMany({ include: { fields: true } });
  res.json({ forms });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
