import { WebSocketServer } from 'ws';
import url from 'url';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

function getTokenFromRequest(req) {
  try {
    const parsed = url.parse(req.url, true);
    const qToken = parsed.query?.token;
    const auth = req.headers['authorization'];
    const bearer = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    return qToken || bearer || null;
  } catch {
    return null;
  }
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

function safeSend(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export default function initWsChat(server) {
  const wss = new WebSocketServer({ server, path: '/socket.io' });

  // Room maps
  const userRooms = new Map(); // userId -> Set<ws>
  const convRooms = new Map(); // convId -> Set<ws>

  function joinUserRoom(userId, ws) {
    const key = String(userId);
    if (!userRooms.has(key)) userRooms.set(key, new Set());
    userRooms.get(key).add(ws);
  }

  function leaveAllRooms(ws) {
    for (const set of userRooms.values()) set.delete(ws);
    for (const set of convRooms.values()) set.delete(ws);
  }

  function joinConvRoom(convId, ws) {
    const key = String(convId);
    if (!convRooms.has(key)) convRooms.set(key, new Set());
    convRooms.get(key).add(ws);
  }

  function emitToUser(userId, event, payload) {
    const set = userRooms.get(String(userId));
    if (!set) return;
    for (const c of set) safeSend(c, { event, data: payload });
  }

  function emitToConv(convId, event, payload) {
    const set = convRooms.get(String(convId));
    if (!set) return;
    for (const c of set) safeSend(c, { event, data: payload });
  }

  wss.on('connection', async (ws, req) => {
    try {
        console.log('đasad');
        
      const token = getTokenFromRequest(req);
      console.log(token);
      
      if (!token) {
        ws.close(4001, 'unauthorized');
        return;
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const userId = Number(payload.userId);
      if (!userId) {
        ws.close(4001, 'unauthorized');
        return;
      }
      ws.userId = userId;
      joinUserRoom(userId, ws);
    } catch (e) {
      console.log(e);
      ws.close(4001, 'unauthorized');
      return;
    }

    ws.on('message', async (raw) => {
      try {
         console.log('adsasdsdssssssssss');
        const msg = JSON.parse(raw.toString());
        const { event, data } = msg || {};
        const userId = ws.userId;

        if (event === 'join_conversation') {
            console.log('adssdadsad');

          const otherId = Number(data?.other_user_id);
          if (!otherId) return;
          const conv = await ensureConversation(userId, otherId);
          joinConvRoom(conv.id, ws);
          safeSend(ws, { event: 'join_conversation_ack', data: { ok: true, conversation_id: conv.id } });
          return;
        }

        if (event === 'send_message') {
          const { receiver_id, conversation_id, type, content, attachments } = data || {};
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

          emitToConv(convId, 'new_message', { conversation_id: convId, message });
          if (!conv) {
            const [convRows] = await db.pool.query(`SELECT * FROM conversations WHERE id = ?`, [convId]);
            conv = convRows[0];
          }
          const otherId = otherParticipant(conv, userId);
          if (otherId) emitToUser(otherId, 'notify_conversation', { conversation_id: convId });

          safeSend(ws, { event: 'send_message_ack', data: { ok: true, conversation_id: convId, message_id: messageId } });
          return;
        }

        if (event === 'read_messages') {
          const conversation_id = Number(data?.conversation_id);
          if (!conversation_id) return;
          await db.pool.query(
            `UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id <> ? AND is_read = 0`,
            [conversation_id, userId]
          );
          emitToConv(conversation_id, 'messages_read', { conversation_id, reader_id: userId });
          return;
        }

        if (event === 'typing') {
          const conversation_id = Number(data?.conversation_id);
          const is_typing = Boolean(data?.is_typing);
          emitToConv(conversation_id, 'typing', { conversation_id, user_id: userId, is_typing });
          return;
        }
      } catch (e) {
        // ignore parse error
      }
    });

    ws.on('close', () => {
      leaveAllRooms(ws);
    });
  });
}
