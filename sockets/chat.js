import jwt from 'jsonwebtoken';
import db from '../config/db.js';

function getTokenFromHandshake(socket) {
  const authToken = socket.handshake.auth?.token || socket.handshake.query?.token;
  const header = socket.handshake.headers?.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  return authToken || bearer || null;
}

async function ensureConversation(userA, userB) {
  const [rows] = await db.pool.query(
    `SELECT * FROM conversations WHERE 
      (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?) LIMIT 1`,
    [userA, userB, userB, userA]
  );
  if (rows.length > 0) return rows[0];
  const u1 = Math.min(userA, userB);
  const u2 = Math.max(userA, userB);
  const [result] = await db.pool.query(
    `INSERT INTO conversations (user1_id, user2_id, created_at) VALUES (?, ?, NOW())`,
    [u1, u2]
  );
  return { id: result.insertId, user1_id: u1, user2_id: u2 };
}

async function insertMessage({ conversationId, senderId, type, content, attachments }) {
  const [res] = await db.pool.query(
    `INSERT INTO messages (conversation_id, sender_id, type, content, is_read, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [conversationId, senderId, type, content]
  );
  const messageId = res.insertId;
  if (attachments && attachments.length) {
    const values = attachments.map((url) => [messageId, url]);
    await db.pool.query(
      `INSERT INTO message_attachments (message_id, url_image, created_at) VALUES ?`,
      [values.map(v => [v[0], v[1], new Date()])]
    );
  }
  return messageId;
}

async function updateConversationLastMessage({ conversationId, type, content }) {
  let lastMessage = content || '';
  if (type === 'image' && !lastMessage) lastMessage = '[image]';
  await db.pool.query(
    `UPDATE conversations SET last_message = ?, last_message_type = ?, last_message_at = NOW() WHERE id = ?`,
    [lastMessage, type, conversationId]
  );
}

function otherParticipant(conversation, userId) {
  if (!conversation) return null;
  return conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
}

export default function initChatSockets(io) {
  io.use((socket, next) => {
    try {
      const token = getTokenFromHandshake(socket);
      if (!token) return next(new Error('unauthorized'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.id };
      if (!socket.user.id) return next(new Error('unauthorized'));
      next();
    } catch (e) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log(socket.user);
     console.log('conneeccttt');
    const userId = Number(socket.user.id);
    socket.join(`user:${userId}`);

    socket.on('join_conversation', async ({ other_user_id }, cb) => {
      try {
        const otherId = Number(other_user_id);
        const conv = await ensureConversation(userId, otherId);
        socket.join(`conv:${conv.id}`);
        cb && cb({ ok: true, conversation_id: conv.id });
      } catch (err) {
        cb && cb({ ok: false, error: 'join_failed' });
      }
    });

    socket.on('send_message', async (payload, cb) => {
      try {
        const { receiver_id, conversation_id, type, content, attachments } = payload;
        let convId = conversation_id;
        let conv = null;
        if (!convId) {
          const ensured = await ensureConversation(userId, Number(receiver_id));
          convId = ensured.id;
          conv = ensured;
        }
        const messageId = await insertMessage({ conversationId: convId, senderId: userId, type, content, attachments });
        await updateConversationLastMessage({ conversationId: convId, type, content });

        const [messageRows] = await db.pool.query(
          `SELECT m.*, u.id AS sender_id FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
          [messageId]
        );
        const message = messageRows[0];

        io.to(`conv:${convId}`).emit('new_message', { conversation_id: convId, message });
        if (!conv) {
          const [convRows] = await db.pool.query(`SELECT * FROM conversations WHERE id = ?`, [convId]);
          conv = convRows[0];
        }
        const otherId = otherParticipant(conv, userId);
        if (otherId) io.to(`user:${otherId}`).emit('notify_conversation', { conversation_id: convId });

        cb && cb({ ok: true, conversation_id: convId, message_id: messageId });
      } catch (err) {
        cb && cb({ ok: false, error: 'send_failed' });
      }
    });

    socket.on('read_messages', async ({ conversation_id }, cb) => {
      try {
        await db.pool.query(
          `UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id <> ? AND is_read = 0`,
          [conversation_id, userId]
        );
        io.to(`conv:${conversation_id}`).emit('messages_read', { conversation_id, reader_id: userId });
        cb && cb({ ok: true });
      } catch (err) {
        cb && cb({ ok: false, error: 'read_failed' });
      }
    });

    socket.on('typing', ({ conversation_id, is_typing }) => {
      io.to(`conv:${conversation_id}`).emit('typing', { conversation_id, user_id: userId, is_typing });
    });

    socket.on('disconnect', () => {});
  });
}
