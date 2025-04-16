import type { NextApiRequest, NextApiResponse } from 'next';
import User from '../../../../models/User';
import { verifyToken } from '../../../../middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyToken(req, res, async () => {
    if (req.method === 'PUT') {
      try {
        const user = (req as any).user;
        const { currentPassword, newPassword } = req.body;
        const userDoc = await User.findById(user._id);
        if (!userDoc) {
          return res.status(404).json({ error: 'User not found' });
        }
        const isValid = await userDoc.comparePassword(currentPassword);
        if (!isValid) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
        userDoc.password = newPassword;
        userDoc.updatedAt = Date.now();
        await userDoc.save();
        res.json({ message: 'Password updated successfully' });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    } else {
      res.setHeader('Allow', ['PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
