import type { NextApiRequest, NextApiResponse } from 'next';
import User from '../../../models/User';
import { verifyToken } from '../../../middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyToken(req, res, async () => {
    if (req.method === 'GET') {
      try {
        const user = (req as any).user;
        const userDoc = await User.findById(user._id).select('-password');
        res.status(200).json(userDoc);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
