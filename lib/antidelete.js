// lib/antidelete.js
const { getContentType, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

// Download any media message type into a Buffer
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
        console.error('[ANTIDELETE] Media download failed:', err.message);
        return null;
    }
}

async function handleAntidelete(conn, updates, store, botNumber) {
    try {
        // Get bot owner numbers from config
        const ownerNumbers = config.OWNER_NUMBER || [];
        if (!ownerNumbers.length) {
            console.log('[ANTIDELETE] No owner numbers configured');
            return;
        }

        // Convert owner numbers to JIDs
        const ownerJids = ownerNumbers.map(num => {
            const cleanNum = num.replace(/[^0-9]/g, '');
            return cleanNum + '@s.whatsapp.net';
        });

        for (const update of updates) {
            // Check if message is deleted
            if (update.update && update.update.message) {
                const message = update.update.message;
                const key = update.key;

                // Check if it's a protocol message (delete)
                if (message.protocolMessage && message.protocolMessage.type === 0) {
                    const deletedMessageKey = message.protocolMessage.key;

                    // Get the deleted message from store
                    const deletedMsg = await store.loadMessage(
                        deletedMessageKey.remoteJid,
                        deletedMessageKey.id
                    );

                    if (deletedMsg && deletedMsg.message) {
                        // Get sender info
                        const sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
                        const from = deletedMsg.key.remoteJid;
                        const isGroup = from.endsWith('@g.us');

                        // Get message content
                        let content = '';
                        let msgType = getContentType(deletedMsg.message);
                        let msgObjForDownload = deletedMsg.message;

                        // Handle ephemeral / view-once wrappers
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
                        } else if (msgType === 'audioMessage') {
                            content = '';
                        } else if (msgType === 'stickerMessage') {
                            content = '';
                        } else if (msgType === 'documentMessage') {
                            content = msgObjForDownload.documentMessage.fileName || 'Document';
                        } else if (msgType === 'locationMessage') {
                            content = '📍 Location';
                        } else if (msgType === 'contactMessage') {
                            content = '👤 Contact';
                        } else if (msgType === 'buttonsMessage') {
                            content = '🔘 Buttons';
                        } else if (msgType === 'listMessage') {
                            content = '📋 List';
                        } else {
                            content = '📨 Message';
                        }

                        // Get chat name
                        let chatName = isGroup ? await getGroupName(conn, from) : 'Private Chat';
                        let senderName = deletedMsg.pushName || sender.split('@')[0];

                        const caption = `⚠️ *MESSAGE DELETED DETECTED!*\n\n` +
                                        `📱 *From:* ${senderName}\n` +
                                        `👤 *Number:* @${sender.split('@')[0]}\n` +
                                        `💬 *Chat:* ${chatName}\n` +
                                        `📌 *Type:* ${isGroup ? 'Group' : 'Private'}\n` +
                                        `🕐 *Time:* ${new Date().toLocaleString()}` +
                                        (content ? `\n📝 *Text/Caption:* ${content}` : '');

                        // Send to ALL owners
                        for (const ownerJid of ownerJids) {
                            try {
                                if (isMedia) {
                                    const buffer = await downloadMedia(msgObjForDownload, msgType);

                                    if (!buffer) {
                                        // Fallback to text-only if download failed
                                        await conn.sendMessage(ownerJid, { text: caption, mentions: [sender] });
                                        continue;
                                    }

                                    if (msgType === 'imageMessage') {
                                        await conn.sendMessage(ownerJid, {
                                            image: buffer,
                                            caption,
                                            mentions: [sender]
                                        });
                                    } else if (msgType === 'videoMessage') {
                                        await conn.sendMessage(ownerJid, {
                                            video: buffer,
                                            caption,
                                            mentions: [sender]
                                        });
                                    } else if (msgType === 'audioMessage') {
                                        // Send caption first (audio messages can't carry captions)
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
                                    await conn.sendMessage(ownerJid, {
                                        text: caption,
                                        mentions: [sender]
                                    });
                                }
                                console.log(`[ANTIDELETE] Sent to owner: ${ownerJid}`);
                            } catch (err) {
                                console.error(`[ANTIDELETE] Failed to send to ${ownerJid}:`, err.message);
                                // Fallback: try sending text alert even if media send failed
                                try {
                                    await conn.sendMessage(ownerJid, { text: caption, mentions: [sender] });
                                } catch (_) {}
                            }
                        }

                        console.log(`[ANTIDELETE] Deleted ${msgType} from ${sender} in ${from}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('[ANTIDELETE ERROR]', error);
    }
}

// Helper function to get group name
async function getGroupName(conn, jid) {
    try {
        const metadata = await conn.groupMetadata(jid);
        return metadata.subject || 'Unknown Group';
    } catch (error) {
        return 'Unknown Group';
    }
}

module.exports = { handleAntidelete };
