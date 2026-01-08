import express, { Request, Response } from "express";
import pool from "../../db/db";
import hashPassword from "../../utils/hashPassword";
import { authenticateToken } from "../../middlewares/authenticateToken";
import isAdmin from "../../middlewares/isAdmin";
import decodeToken from "../../utils/decodeToken";
import matchPassword from "../../utils/matchPassword";
import { enforce2FA } from "../../middlewares/enforce2FA";
import { sendEmail } from "../../utils/mailer";
import { welcomeEmployeeEmail } from "../../templates/welcomeEmployeeEmail";
import { offerLetterTemplate } from "../../templates/offerLetter";
import { generatePdf } from "../../utils/pdfGenerator";

const router = express.Router();

router.post(
  "/addEmp",
  authenticateToken,
  isAdmin,
  enforce2FA,
  async (req: Request, res: Response) => {
    const {
      name,
      email,
      designation,
      phone,
      location,
      joining_date,
      salary,
      skills,
      employment_type,
    } = req.body;

    if (
      !name ||
      !email ||
      !designation ||
      !phone ||
      !location ||
      !joining_date ||
      !salary ||
      !skills ||
      !employment_type
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    try {
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (user.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }
      // Generate random 8-character password
      const crypto = await import("crypto");
      const generatedPassword = crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();
      const hashedPassword = await hashPassword(generatedPassword);

      const newUser = await pool.query(
        "INSERT INTO users (name, email, password_hash, designation, phone, location, joining_date, salary, skills, employment_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
        [
          name,
          email,
          hashedPassword,
          designation,
          phone,
          location,
          joining_date,
          salary,
          skills,
          employment_type,
        ]
      );

      // Send response immediately to unblock UI
      res.json({ user: newUser.rows[0] });

      // Send Welcome Email in background
      if (newUser.rows.length > 0) {
        const createdUser = newUser.rows[0];
        // @ts-ignore
        const adminId = req.user?.id;

        (async () => {
          try {
            const adminRes = await pool.query(
              "SELECT name, designation FROM users WHERE id = $1",
              [adminId]
            );
            const adminData = adminRes.rows[0];

            const dashboardLink = `${
              process.env.CLIENT_URL || "http://localhost:5173"
            }/login`;

            const emailHtml = welcomeEmployeeEmail(
              createdUser.name,
              createdUser.email,
              adminData.name,
              dashboardLink,
              generatedPassword,
              createdUser.designation,
              createdUser.joining_date,
              createdUser.employment_type
            );

            const offerLetterHtml = offerLetterTemplate(
              createdUser.name,
              createdUser.designation,
              createdUser.joining_date,
              String(createdUser.salary),
              adminData.name,
              adminData.designation,
              createdUser.location
            );

            const pdfBuffer = await generatePdf(offerLetterHtml);

            await sendEmail({
              to: createdUser.email,
              subject: "Welcome to the Team of Auto Computation! 🚀",
              html: emailHtml,
              attachments: [
                {
                  filename: "Offer_Letter.pdf",
                  content: pdfBuffer,
                  contentType: "application/pdf",
                },
              ],
            });
            console.log(`Welcome email sent to ${createdUser.email}`);
          } catch (emailError) {
            console.error(
              "Failed to send welcome email/offer letter:",
              emailError
            );
          }
        })();
      }
    } catch (error) {
      console.error("Error adding user:", error);
      // Only send error response if we haven't sent success response yet.
      // Since we moved res.json up, this catch block might catch errors from lines before res.json.
      // errors inside the async background block are caught by its own try/catch.
      if (!res.headersSent) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
);

router.put(
  "/updateEmp/:id",
  authenticateToken,
  isAdmin,
  enforce2FA,
  async (req: Request, res: Response) => {
    const client = await pool.connect();

    const { id } = req.params;
    const {
      name,
      email,
      designation,
      phone,
      location,
      joining_date,
      salary,
      skills,
      employment_type,
    } = req.body;

    if (!name || !email || !designation || !phone || !salary) {
      return res.status(400).json({
        message: "Key fields are required for update",
      });
    }

    try {
      await client.query("BEGIN");

      const existingUserResult = await client.query(
        "SELECT salary FROM users WHERE id = $1",
        [id]
      );

      if (existingUserResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Employee not found" });
      }

      const existingSalary = existingUserResult.rows[0].salary;

      const emailCheck = await client.query(
        "SELECT 1 FROM users WHERE email = $1 AND id != $2",
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Email is already in use by another employee",
        });
      }

      // 3️⃣ Update users table
      const updatedUser = await client.query(
        `UPDATE users
       SET name = $1,
           email = $2,
           designation = $3,
           phone = $4,
           location = $5,
           joining_date = $6,
           salary = $7,
           skills = $8,
           employment_type = $9
       WHERE id = $10
       RETURNING *`,
        [
          name,
          email,
          designation,
          phone,
          location,
          joining_date,
          salary,
          skills,
          employment_type,
          id,
        ]
      );

      // 4️⃣ If salary changed → update payroll
      if (Number(existingSalary) !== Number(salary)) {
        await client.query(
          `UPDATE payroll
         SET basic_salary = $1
         WHERE user_id = $2`,
          [salary, id]
        );
      }

      await client.query("COMMIT");

      res.json({
        message: "Employee updated successfully",
        user: updatedUser.rows[0],
        salaryUpdatedInPayroll: Number(existingSalary) !== Number(salary),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Internal server error" });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/all",
  authenticateToken,
  isAdmin,
  enforce2FA,
  async (req: Request, res: Response) => {
    try {
      const queryText = `
            SELECT
                id, name, email, role, designation,
                phone, location, joining_date, salary,
                skills, employment_type, status, avatar_url
            FROM users
            WHERE role = 'employee'
            ORDER BY created_at DESC
        `;

      const result = await pool.query(queryText);
      if (result.rows.length === 0) {
        return res.status(200).json({ users: [] });
      }

      res.status(200).json({ users: result.rows });
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Remove Employee
router.post(
  "/removeEmp/:id",
  authenticateToken,
  isAdmin,
  enforce2FA,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, password } = req.body;
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const adminData: any = await decodeToken(token);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 3. Fetch the user first (Use 'client', not 'pool')
      const userRes = await client.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);

      if (userRes.rows.length === 0) {
        await client.query("ROLLBACK"); // Cancel transaction
        return res.status(404).json({ message: "Employee not found" });
      }

      const admin = await client.query("SELECT * FROM users WHERE id = $1", [
        adminData.id,
      ]);
      if (admin.rows.length === 0) {
        await client.query("ROLLBACK"); // Cancel transaction
        return res.status(404).json({ message: "Admin not found" });
      }

      const adminPasswordMatched = await matchPassword(
        password,
        admin.rows[0].password_hash
      );
      if (!adminPasswordMatched) {
        await client.query("ROLLBACK"); // Cancel transaction
        return res.status(401).json({ message: "Invalid password" });
      }

      const user = userRes.rows[0];

      // 4. Insert into History (past_employees)
      // Note: We map user.id to original_user_id to keep a reference
      const insertQuery = `
      INSERT INTO past_employees
      (original_user_id, name, email, designation, phone, location, joining_date, skills, employment_type, reason_for_exit, removed_by_admin_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

      await client.query(insertQuery, [
        user.id,
        user.name,
        user.email,
        user.designation,
        user.phone,
        user.location,
        user.joining_date,
        user.skills,
        user.employment_type,
        reason || "Not specified",
        adminData.id,
      ]);

      // 5. Delete from users table
      await client.query("DELETE FROM users WHERE id = $1", [id]);

      // 6. Commit the changes (Save everything)
      await client.query("COMMIT");

      res.json({
        message: "Employee removed and archived successfully",
        removedUser: user.name,
      });
    } catch (error) {
      // 7. Rollback (Undo everything if ANY step failed)
      await client.query("ROLLBACK");
      console.error("Error performing transaction:", error);
      res
        .status(500)
        .json({ message: "Transaction failed. No changes were made." });
    } finally {
      client.release();
    }
  }
);

//getting all past emp
router.get(
  "/allPastEmp",
  authenticateToken,
  isAdmin,
  enforce2FA,
  async (req: Request, res: Response) => {
    try {
      const queryText = `
            SELECT
                id,
                original_user_id,
                name,
                email,
                designation,
                phone,
                location,
                skills,
                employment_type,
                joining_date,
                exit_date,
                reason_for_exit,
                removed_by_admin_id
            FROM past_employees
            ORDER BY exit_date DESC
        `;

      const result = await pool.query(queryText);

      if (result.rows.length === 0) {
        return res.status(200).json({ users: [] });
      }

      res.status(200).json({ users: result.rows });
    } catch (error) {
      console.error("Error fetching past employees:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

//Only for meeting purposes
router.get(
  "/all/meetings",
  authenticateToken,
  isAdmin,
  enforce2FA,
  async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.token;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const adminData: any = await decodeToken(token);
      const queryText = `
            SELECT
                id, name, email, role, designation,
                phone, location, joining_date, salary,
                skills, employment_type, status, avatar_url
            FROM users where id != $1
        `;

      const result = await pool.query(queryText, [adminData.id]);
      if (result.rows.length === 0) {
        return res.status(200).json({ users: [] });
      }

      res.status(200).json({ users: result.rows });
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
