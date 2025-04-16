import type { NextApiRequest, NextApiResponse } from 'next';
import User from '../../models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const payload = {
      _id: user._id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '12h' });
    res.status(200).json({ token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
