// lib/antidelete-manager.js
// ============================================
// STANDALONE ANTI-DELETE MANAGER
// Independent of main.js's own listeners — call
// initAntideleteManager(conn, store, botNumber) once per
// connection right after the socket is created.
// ============================================

const { getContentType, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../config');
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

function getOwnerJid(botNumber) {
    // In this multi-user bot, the number that paired the session IS the
    // owner of that session — alerts must go to THEM, not to a hardcoded
    // number in config.js (which is only the developer's own number and
    // would leak every user's deleted messages to the wrong inbox).
    if (!botNumber) return null;
    const cleanNum = botNumber.replace(/[^0-9]/g, '');
    if (!cleanNum) return null;
    return cleanNum + '@s.whatsapp.net';
}

async function sendDebug(conn, botNumber, text) {
    try {
        const ownerJid = getOwnerJid(botNumber);
        if (!ownerJid) return;
        await conn.sendMessage(ownerJid, { text: `🔧 *ANTIDELETE DEBUG*\n\n${text}` });
    } catch (_) {}
}

async function processDeletedMessage(conn, store, botNumber, deletedMessageKey) {
    const deletedMsg = await store.loadMessage(
        deletedMessageKey.remoteJid,
        deletedMessageKey.id
    );

    if (!deletedMsg || !deletedMsg.message) {
        await sendDebug(conn, botNumber, `Store lookup failed for jid=${deletedMessageKey.remoteJid} id=${deletedMessageKey.id}\nMessage was likely not cached before deletion, or store was cleared.`);
        return;
    }

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
}

/**
 * Call this once right after makeWASocket() creates `conn`, and after
 * store.bind(conn.ev) has run. It registers its own messages.update
 * listener, independent of anything else in main.js.
 */
function initAntideleteManager(conn, store, botNumber) {
    conn.ev.on('messages.update', async (updates) => {
        try {
            const liveConfig = await getUserConfigFromMongoDB(botNumber) || {};

            for (const u of updates) {
                const hasProtocolDelete = !!(u.update?.message?.protocolMessage && u.update.message.protocolMessage.type === 0);
                const hasStubDelete = u.update?.messageStubType === 68;

                if (!hasProtocolDelete && !hasStubDelete) continue;

                // Always send a one-line debug ping first so we can confirm the
                // listener is firing and see the live ANTIDELETE flag, regardless
                // of whether the full alert below succeeds.
                await sendDebug(conn, botNumber,
                    `Delete update caught.\nDetected via: ${hasProtocolDelete ? 'protocolMessage' : 'messageStubType(68)'}\nANTIDELETE flag: ${liveConfig.ANTIDELETE}\nbotNumber: ${botNumber}`
                );

                if (liveConfig.ANTIDELETE !== 'true') continue;

                const deletedMessageKey = hasProtocolDelete
                    ? u.update.message.protocolMessage.key
                    : u.key;

                await processDeletedMessage(conn, store, botNumber, deletedMessageKey);
            }
        } catch (error) {
            await sendDebug(conn, botNumber, `Listener error: ${error.message}`);
        }
    });
}

module.exports = { initAntideleteManager };
