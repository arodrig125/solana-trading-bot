import { Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  // Add other fields as needed
}
