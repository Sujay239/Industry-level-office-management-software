import express, { Request, Response } from 'express';
import pool from '../../db/db';
import { authenticateToken } from '../../middlewares/authenticateToken';
import decodeToken from '../../utils/decodeToken';
import matchPassword from '../../utils/matchPassword';
import hashPassword from '../../utils/hashPassword';
const router = express.Router();


router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const decoded: any = await decodeToken(token);
        const id = decoded.id;
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        const isMatch = await matchPassword(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const hashedPassword = await hashPassword(newPassword);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, id]);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
})

export default router;
