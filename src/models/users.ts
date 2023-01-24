import { Schema, model, connect } from 'mongoose';

// 1. Create an interface representing a document in MongoDB.
export interface IUser {
  // Telegram details
  id: number;
  isBot: boolean;
  firstName: string;
  userName: string;
  language: string;
  isPremuim: boolean;

  // Usage and referal details
  messagesSent: number;
  messagesLeft: number;
  invitedBy: string;
}

// 2. Create a Schema corresponding to the document interface.
const userSchema = new Schema<IUser>({
  id: Number,
  isBot: Boolean,
  firstName: String,
  userName: String,
  language: String,
  isPremuim: String,

  messagesSent: Number,
  messagesLeft: Number,
  invitedBy: String,
});

// 3. Create a Model.
export const User = model<IUser>('User', userSchema);
