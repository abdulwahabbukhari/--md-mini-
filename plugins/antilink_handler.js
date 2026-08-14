// ============================================
// 🔗 ANTI-LINK - AUTO HANDLER
// 👑 Developer: SYED ABDUL WAHAB BUKHARI
// ============================================

const { arslan } = require('../arslan');
const { isAllowedLink, extractLinks } = require('./antilink.js');

arslan({
    pattern: "antilink_handler",
    on: "body",
    filename: __filename
}, async (arslan, mek, m, { from, isGroup, isBotAdmins, isAdmins, isOwner, sender, senderNumber }) => {

    // ─── SKIP CHECKS ───
    if (!isGroup) return;
    if (!global.ANTILINK_STATUS || !global.ANTILINK_STATUS[from]) return;
    if (!isBotAdmins) return;
    if (isAdmins || isOwner) return;

    // ─── SKIP BOT'S OWN MESSAGES (Self-skip) ───
    const botJid = arslan.user.id.split(':')[0] + '@s.whatsapp.net';
    if (sender === botJid) return;

    // ─── GET MESSAGE BODY ───
    const msg = mek.message;
    let body = '';
    if (msg.conversation) body = msg.conversation;
    else if (msg.extendedTextMessage?.text) body = msg.extendedTextMessage.text;
    else if (msg.imageMessage?.caption) body = msg.imageMessage.caption;
    else if (msg.videoMessage?.caption) body = msg.videoMessage.caption;
    else return;

    // ─── CHECK FOR LINKS ───
    const links = extractLinks(body);
    if (links.length === 0) return;

    // ─── CHECK IF ALL LINKS ARE ALLOWED ───
    const hasDisallowedLink = links.some(link => !isAllowedLink(link));
    if (!hasDisallowedLink) return;

    // ─── INIT WARN COUNT ───
    if (!global.ANTILINK_WARN) global.ANTILINK_WARN = {};
    if (!global.ANTILINK_WARN[from]) global.ANTILINK_WARN[from] = {};
    if (!global.ANTILINK_WARN[from][senderNumber]) global.ANTILINK_WARN[from][senderNumber] = 0;
    global.ANTILINK_WARN[from][senderNumber]++;

    const action = global.ANTILINK_ACTION[from] || 'warn';
    const warnCount = global.ANTILINK_WARN[from][senderNumber];
    const maxWarns = 3;
    const linkDisplay = links.slice(0, 2).join(', ') + (links.length > 2 ? ` (+${links.length - 2} more)` : '');

    // ─── DELETE MESSAGE ───
    try {
        await arslan.sendMessage(from, { delete: mek.key });
        console.log(`[AntiLink] 🗑️ Deleted link from ${senderNumber}`);
    } catch (e) {
        // Ignore delete errors
    }

    // ─── SEND WARNING ───
    await arslan.sendMessage(from, {
        text: `🔗 *Link detected!*

📌 Links: \`${linkDisplay}\`
👤 User: @${senderNumber}
📊 Warn: ${warnCount}/${maxWarns}

💖 Powered by SYED-MD`,
        mentions: [sender]
    });

    // ─── ACTION: KICK ───
    if (action === 'kick' && warnCount >= maxWarns) {
        try {
            await arslan.groupParticipantsUpdate(from, [sender], 'remove');
            await arslan.sendMessage(from, {
                text: `👢 *User kicked!*

📌 Reason: Repeated links (${warnCount} warns)
👤 User: @${senderNumber}

💖 Powered by SYED-MD`,
                mentions: [sender]
            });
            delete global.ANTILINK_WARN[from][senderNumber];
            console.log(`[AntiLink] 👢 Kicked ${senderNumber} for links`);
        } catch (e) {
            console.log('[AntiLink] Kick error:', e.message);
        }
    }
});

console.log('🔗 Anti-Link Handler Loaded!');
