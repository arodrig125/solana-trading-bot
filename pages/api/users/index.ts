import type { NextApiRequest, NextApiResponse } from 'next';
import User from '../../../models/User';
import { IUser } from '../../../types/User';
import { verifyToken } from '../../../middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyToken(req, res, async () => {
    const user = (req as any).user;
    if (!user || !(user as unknown as IUser).hasPermission('manage_users')) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.method === 'GET') {
      try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    } else if (req.method === 'POST') {
      try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        const newUser = new User({
          username,
          password,
          role,
          createdBy: user._id
        });
        await newUser.save();
        res.status(201).json({
          message: 'User created successfully',
          user: {
            _id: newUser._id,
            username: newUser.username,
            role: newUser.role,
            permissions: newUser.permissions
          }
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
