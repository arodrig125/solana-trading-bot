import type { NextApiRequest, NextApiResponse } from 'next';
import User from '../../../models/User';
import { verifyToken } from '../../../middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyToken(req, res, async () => {
    const user = (req as any).user;
    const { userId } = req.query;
    if (!user || !user.hasPermission || !user.hasPermission('manage_users')) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.method === 'PUT') {
      try {
        const { username, password, role, active } = req.body;
        const userDoc = await User.findById(userId);
        if (!userDoc) {
          return res.status(404).json({ error: 'User not found' });
        }
        if (username) userDoc.username = username;
        if (password) userDoc.password = password;
        if (role) userDoc.role = role;
        if (typeof active === 'boolean') userDoc.active = active;
        userDoc.updatedAt = new Date();
        await userDoc.save();
        res.json({
          message: 'User updated successfully',
          user: {
            _id: userDoc._id,
            username: userDoc.username,
            role: userDoc.role,
            active: userDoc.active,
            permissions: userDoc.permissions
          }
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    } else if (req.method === 'DELETE') {
      try {
        const userDoc = await User.findById(userId);
        if (!userDoc) {
          return res.status(404).json({ error: 'User not found' });
        }
        if (userDoc.role === 'admin') {
          const adminCount = await User.countDocuments({ role: 'admin' });
          if (adminCount <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last admin user' });
          }
        }
        await userDoc.remove();
        res.json({ message: 'User deleted successfully' });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    } else {
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
