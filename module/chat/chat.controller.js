import db from '../../config/db.js';
import ResponseUtil from "../../utils/response_utils.js";

export async function getConversations(req, res) {
  try {
    console.log(req.user);
    
    const userId = Number(req.user?.userId);
    if (!userId) return ResponseUtil.unauthorizedResponse(res, 'Unauthorized');

    const [rows] = await db.pool.query(
      `SELECT 
         c.id,
         c.user1_id,
         c.user2_id,
         CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS partner_id,
         c.last_message,
         c.last_message_type,
         c.last_message_at,
         c.created_at,
         (
           SELECT COUNT(*) FROM messages m
           WHERE m.conversation_id = c.id AND m.sender_id <> ? AND m.is_read = 0
         ) AS unread_count
       FROM conversations c
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY (c.last_message_at IS NULL), c.last_message_at DESC, c.created_at DESC`,
      [userId, userId, userId, userId]
    );
    return ResponseUtil.successResponse(res, rows);
  } catch (err) {
    return ResponseUtil.errorResponse(res, 'internal_error', err.message);
  }
}

export async function getMessages(req, res) {
  try {
    const userId = Number(req.user?.userId);
    if (!userId) return ResponseUtil.unauthorizedResponse(res, 'Unauthorized');

    const conversationId = Number(req.query.conversation_id);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    if (!conversationId) {
      return ResponseUtil.validationErrorResponse(res, 'conversation_id_required');
    }

    // Verify membership
    const [convRows] = await db.pool.query(
      `SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?) LIMIT 1`,
      [conversationId, userId, userId]
    );
    if (convRows.length === 0) {
      return ResponseUtil.forbiddenResponse(res, 'forbidden');
    }

    const [rows] = await db.pool.query(
      `SELECT 
         m.id,
         m.conversation_id,
         m.sender_id,
         m.type,
         m.content,
         m.is_read,
         m.created_at,
         COALESCE(JSON_ARRAYAGG(a.url_image), JSON_ARRAY()) AS attachments
       FROM messages m
       LEFT JOIN message_attachments a ON a.message_id = m.id
       WHERE m.conversation_id = ?
       GROUP BY m.id
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [conversationId, limit, offset]
    );

    return ResponseUtil.successResponse(res, { page, limit, messages: rows });
  } catch (err) {
    return ResponseUtil.errorResponse(res, 'internal_error', err.message);
  }
}
