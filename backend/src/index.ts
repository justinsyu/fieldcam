import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { processRouter } from './routes/process';
import { profilesRouter } from './routes/profiles';

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '25mb' }));

app.use('/v1/process', processRouter);
app.use('/v1/profiles', profilesRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`FieldCam API running on port ${PORT}`));
