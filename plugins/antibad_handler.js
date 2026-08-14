// ============================================
// 🚫 ANTI-BAD WORDS - AUTO HANDLER
// 👑 Developer: SYED ABDUL WAHAB BUKHARI
// ============================================

const { arslan } = require('../arslan');
// Import shared lists from main command file (if needed, or redefine)
// To avoid duplication, we could import, but we redefine for simplicity.
const { BAD_WORDS, BAD_PATTERNS } = require('./antibad.js'); // Requires the other file loaded first.

arslan({
    pattern: "antibad_handler",
    on: "body",
    filename: __filename
}, async (arslan, mek, m, { from, isGroup, isBotAdmins, isAdmins, isOwner, sender, senderNumber, reply }) => {

    // ─── SKIP CHECKS ───
    if (!isGroup) return;
    if (!global.ANTIBAD_STATUS?.[from]) return;
    if (!isBotAdmins) return;
    if (isAdmins || isOwner) return;

    // ─── SKIP OWN MESSAGES (Bot) ───
    const botJid = arslan.user.id.split(':')[0] + '@s.whatsapp.net';
    if (sender === botJid) return;

    // ─── GET MESSAGE BODY ───
    const msg = mek.message;
    let body = '';
    if (msg.conversation) body = msg.conversation;
    else if (msg.extendedTextMessage?.text) body = msg.extendedTextMessage.text;
    else if (msg.imageMessage?.caption) body = msg.imageMessage.caption;
    else if (msg.videoMessage?.caption) body = msg.videoMessage.caption;
    else return; // No text to check

    // ─── CHECK BAD WORDS ───
    let found = false;
    let badWord = '';
    for (const word of BAD_WORDS) {
        if (body.toLowerCase().includes(word.toLowerCase())) {
            found = true;
            badWord = word;
            break;
        }
    }
    if (!found) {
        for (const pattern of BAD_PATTERNS) {
            if (pattern.test(body)) {
                found = true;
                badWord = body.match(pattern)?.[0] || 'bad word';
                break;
            }
        }
    }
    if (!found) return;

    // ─── INIT WARN COUNTER ───
    if (!global.ANTIBAD_WARN[from]) global.ANTIBAD_WARN[from] = {};
    if (!global.ANTIBAD_WARN[from][senderNumber]) global.ANTIBAD_WARN[from][senderNumber] = 0;
    global.ANTIBAD_WARN[from][senderNumber]++;

    const action = global.ANTIBAD_ACTION[from] || 'warn';
    const warnCount = global.ANTIBAD_WARN[from][senderNumber];
    const maxWarns = 3;

    // ─── DELETE OFFENSIVE MESSAGE ───
    try {
        await arslan.sendMessage(from, { delete: mek.key });
    } catch (e) { /* ignore */ }

    // ─── SEND WARNING ───
    await arslan.sendMessage(from, {
        text: `⚠️ *Bad word detected!*
📌 Word: \`${badWord}\`
👤 User: @${senderNumber}
📊 Warn: ${warnCount}/${maxWarns}
💖 Powered by SYED-MD`,
        mentions: [sender]
    });

    // ─── KICK IF EXCEEDS AND ACTION IS KICK ───
    if (action === 'kick' && warnCount >= maxWarns) {
        try {
            await arslan.groupParticipantsUpdate(from, [sender], 'remove');
            await arslan.sendMessage(from, {
                text: `👢 *User kicked!*
📌 Reason: Repeated bad words (${warnCount} warns)
👤 User: @${senderNumber}
💖 Powered by SYED-MD`,
                mentions: [sender]
            });
            delete global.ANTIBAD_WARN[from][senderNumber];
        } catch (e) { /* ignore */ }
    }
});

console.log('🚫 Anti-Bad Words Handler Loaded!');
