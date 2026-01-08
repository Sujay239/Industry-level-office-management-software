import express, { Request, Response } from 'express';
import pool from '../../db/db';
import hashPassword from '../../utils/hashPassword';
import matchPassword from '../../utils/matchPassword';
import { authenticateToken } from '../../middlewares/authenticateToken';
import isAdmin from '../../middlewares/isAdmin';
import { enforce2FA } from '../../middlewares/enforce2FA';
import decodeToken from '../../utils/decodeToken';
const router = express.Router();


router.post('/addAdmin', authenticateToken, isAdmin, enforce2FA, async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if email already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const hashedPassword = await hashPassword(password);
        // Explicitly setting status to 'active' and created_at defaults
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, hashedPassword, 'admin']
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error("Error adding admin:", error);
        res.status(500).json({ message: error.message || "Failed to add admin" });
    }
});


router.get('/getAdmins', authenticateToken, isAdmin, enforce2FA, async (req: Request, res: Response) => {
    try {
        const queryText = `
            SELECT id, name, email, role, avatar_url, status, created_at
            FROM users
            WHERE role = 'admin'
            ORDER BY created_at DESC
        `;

        const result = await pool.query(queryText);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No admins found' });
        }

        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({
            message: 'Internal server error while fetching admins'
        });
    }
});


router.delete('/removeAdmin/:id', authenticateToken, isAdmin, enforce2FA, async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const data: any = await decodeToken(token);
        const currentAdminId = data.id;
        const currentUserResult = await client.query('SELECT password_hash FROM users WHERE id = $1', [currentAdminId]);

        if (currentUserResult.rows.length === 0) {
            return res.status(404).json({ message: "Current user not found" });
        }

        const isValidPassword = await matchPassword(password, currentUserResult.rows[0].password_hash);
        if (!isValidPassword) {
            return res.status(403).json({ message: "Incorrect password" });
        }

        await client.query('BEGIN');
        if (!id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Admin ID is required' });
        }

        const queryText = `
            DELETE FROM users
            WHERE id = $1 AND role = 'admin'
            RETURNING *
        `;

        const admins = await client.query('SELECT * FROM users WHERE role = $1', ['admin']);

        if (admins.rows.length === 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Failed to remove last admin' });
        }

        const result = await client.query(queryText, [id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Admin not found' });
        }

        await client.query('COMMIT');
        res.status(200).json({
            message: 'Admin removed successfully',
            admin: result.rows[0]
        });
    } catch (error) {
        console.error('Error removing admin:', error);
        await client.query('ROLLBACK');
        res.status(500).json({
            message: 'Internal server error while removing admin'
        });
    } finally {
        client.release();
    }
});

export default router;
