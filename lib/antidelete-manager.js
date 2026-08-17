// lib/antidelete-manager.js
// ============================================
// STANDALONE ANTI-DELETE MANAGER
// Handles "Delete for everyone" detection and resends the original
// message (including media) to the number that paired the session.
// Exposes processDeletedMessage() so it can be triggered from both
// the messages.update event AND messages.upsert (some delete events
// only arrive as a bare stub inside messages.upsert with no message
// payload, which is the main path that was previously being missed).
// ============================================

const { getContentType, downloadContentFromMessage, jidNormalizedUser } = require('@whiskeysockets/baileys');
const { getUserConfigFromMongoDB } = require('./database');

// ---------- Media download helper ----------
async function downloadMedia(message, msgType) {
    try {
        let mediaTypeKey;
        if (msgType === 'imageMessage') mediaTypeKey = 'image';
        else if (msgType === 'videoMessage') mediaTypeKey = 'video';
        else if (msgType === 'audioMessage') mediaTypeKey = 'audio';
        else if (msgType === 'stickerMessage') mediaTypeKey = 'sticker';
        else if (msgType === 'documentMessage') mediaTypeKey = 'document';
        else return null;

        const stream = await downloadContentFromMessage(message[msgType], mediaTypeKey);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (err) {
        return null;
    }
}

async function getGroupName(conn, jid) {
    try {
        const metadata = await conn.groupMetadata(jid);
        return metadata.subject || 'Unknown Group';
    } catch (error) {
        return 'Unknown Group';
    }
}

// The number that paired THIS session is the owner of THIS session —
// alerts go to them, not to a hardcoded config.js number.
function getOwnerJid(botNumber) {
    if (!botNumber) return null;
    const cleanNum = botNumber.replace(/[^0-9]/g, '');
    if (!cleanNum) return null;
    return cleanNum + '@s.whatsapp.net';
}

async function processDeletedMessage(conn, store, botNumber, deletedMessageKey) {
    try {
        const remoteJid = jidNormalizedUser(deletedMessageKey.remoteJid);
        const deletedMsg = await store.loadMessage(
            remoteJid,
            deletedMessageKey.id
        );

        if (!deletedMsg || !deletedMsg.message) return;

        const sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
        const from = deletedMsg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        let content = '';
        let msgType = getContentType(deletedMsg.message);
        let msgObjForDownload = deletedMsg.message;

        if (msgType === 'ephemeralMessage') {
            msgObjForDownload = deletedMsg.message.ephemeralMessage.message;
            msgType = getContentType(msgObjForDownload);
        }
        if (msgType === 'viewOnceMessage' || msgType === 'viewOnceMessageV2') {
            msgObjForDownload = msgObjForDownload[msgType].message;
            msgType = getContentType(msgObjForDownload);
        }

        const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(msgType);

        if (msgType === 'conversation') {
            content = deletedMsg.message.conversation;
        } else if (msgType === 'extendedTextMessage') {
            content = deletedMsg.message.extendedTextMessage.text;
        } else if (msgType === 'imageMessage') {
            content = msgObjForDownload.imageMessage.caption || '';
        } else if (msgType === 'videoMessage') {
            content = msgObjForDownload.videoMessage.caption || '';
        } else if (msgType === 'documentMessage') {
            content = msgObjForDownload.documentMessage.fileName || 'Document';
        } else if (msgType === 'locationMessage') {
            content = '📍 Location';
        } else if (msgType === 'contactMessage') {
            content = '👤 Contact';
        } else {
            content = '';
        }

        const chatName = isGroup ? await getGroupName(conn, from) : 'Private Chat';
        const senderName = deletedMsg.pushName || sender.split('@')[0];

        const caption = `⚠️ *MESSAGE DELETED DETECTED!*\n\n` +
                        `📱 *From:* ${senderName}\n` +
                        `👤 *Number:* @${sender.split('@')[0]}\n` +
                        `💬 *Chat:* ${chatName}\n` +
                        `📌 *Type:* ${isGroup ? 'Group' : 'Private'}\n` +
                        `🕐 *Time:* ${new Date().toLocaleString()}` +
                        (content ? `\n📝 *Text/Caption:* ${content}` : '');

        const ownerJid = getOwnerJid(botNumber);
        if (!ownerJid) return;

        try {
            if (isMedia) {
                const buffer = await downloadMedia(msgObjForDownload, msgType);
                if (!buffer) {
                    await conn.sendMessage(ownerJid, { text: caption, mentions: [sender] });
                    return;
                }
                if (msgType === 'imageMessage') {
                    await conn.sendMessage(ownerJid, { image: buffer, caption, mentions: [sender] });
                } else if (msgType === 'videoMessage') {
                    await conn.sendMessage(ownerJid, { video: buffer, caption, mentions: [sender] });
                } else if (msgType === 'audioMessage') {
                    await conn.sendMessage(ownerJid, { text: caption, mentions: [sender] });
                    await conn.sendMessage(ownerJid, {
                        audio: buffer,
                        mimetype: msgObjForDownload.audioMessage.mimetype || 'audio/ogg; codecs=opus',
                        ptt: msgObjForDownload.audioMessage.ptt || false
                    });
                } else if (msgType === 'stickerMessage') {
                    await conn.sendMessage(ownerJid, { text: caption, mentions: [sender] });
                    await conn.sendMessage(ownerJid, { sticker: buffer });
                } else if (msgType === 'documentMessage') {
                    await conn.sendMessage(ownerJid, {
                        document: buffer,
                        mimetype: msgObjForDownload.documentMessage.mimetype || 'application/octet-stream',
                        fileName: msgObjForDownload.documentMessage.fileName || 'file',
                        caption,
                        mentions: [sender]
                    });
                }
            } else {
                await conn.sendMessage(ownerJid, { text: caption, mentions: [sender] });
            }
        } catch (err) {
            try {
                await conn.sendMessage(ownerJid, { text: caption, mentions: [sender] });
            } catch (_) {}
        }
    } catch (outerErr) {
        // Fail silently — never let antidelete crash the bot
    }
}

/**
 * Call this once right after makeWASocket() creates `conn`, and after
 * store.bind(conn.ev) has run. This is a secondary/backup path — the
 * primary detection now also runs directly inside main.js's
 * messages.upsert handler, since that is where bare revoke stubs
 * (no message payload) actually arrive in this Baileys setup.
 */
function initAntideleteManager(conn, store, botNumber) {
    conn.ev.on('messages.update', async (updates) => {
        try {
            const liveConfig = await getUserConfigFromMongoDB(botNumber) || {};
            if (liveConfig.ANTIDELETE !== 'true') return;

            for (const u of updates) {
                const hasProtocolDelete = !!(u.update?.message?.protocolMessage && u.update.message.protocolMessage.type === 0);
                const hasStubDelete = u.update?.messageStubType === 68;

                if (!hasProtocolDelete && !hasStubDelete) continue;

                const deletedMessageKey = hasProtocolDelete
                    ? u.update.message.protocolMessage.key
                    : u.key;

                // Normalize missing remoteJid the same way as the primary path in
                // main.js — some DM revokes omit it on the inner key.
                const normalizedKey = deletedMessageKey?.remoteJid
                    ? deletedMessageKey
                    : { ...deletedMessageKey, remoteJid: u.key.remoteJid };

                await processDeletedMessage(conn, store, botNumber, normalizedKey);
            }
        } catch (error) {
            // Fail silently — never let antidelete crash the bot
        }
    });
}

module.exports = { initAntideleteManager, processDeletedMessage };
