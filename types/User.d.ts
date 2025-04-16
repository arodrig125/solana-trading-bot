import { Document, ObjectId } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  wallets: string[];
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  apiKeys: Array<{
    key: string;
    label: string;
    createdAt: Date;
    lastUsed?: Date;
  }>;
  role: 'admin' | 'trader' | 'analyst' | 'viewer' | 'support' | 'code_reviewer';
  tradingLimit: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  apiAccess: {
    enabled: boolean;
    rateLimit: number;
    allowedEndpoints: string[];
  };
  permissions: string[];
  active: boolean;
  lastLogin?: Date;
  createdBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: string): boolean;
}
