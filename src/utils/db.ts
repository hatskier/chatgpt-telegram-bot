import { connect } from 'mongoose';
import env from './env';

export const connectToDB = async () => {
  console.log('Connecting to DB');
  await connect(env.MONGO_DB_URL);
  console.log('DB connected');
};
