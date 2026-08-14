const { cmd } = require('../arslan');

const ALLOWED_DOMAINS = [
    'whatsapp.com', 'wa.me', 'youtube.com', 'youtu.be',
    'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
    'tiktok.com', 'github.com', 'google.com', 'drive.google.com'
];

const LINK_PATTERNS = [
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
];

function isAllowedLink(url) {
    try { return ALLOWED_DOMAINS.some(d => new URL(url).hostname.includes(d)); } catch { return false; }
}
function extractLinks(text) {
    let links = [];
    for (const p of LINK_PATTERNS) {
        const matches = text.match(p);
        if (matches) matches.forEach(m => { if (!links.includes(m)) links.push(m); });
    }
    return links;
}

cmd({
    pattern: "antilink_handler",
    on: "body",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, isOwner, sender, senderNumber }) => {
    if (!isGroup) return;
    if (!global.ANTILINK_STATUS?.[from]) return;
    if (!isBotAdmins) return;
    if (isAdmins || isOwner) return;

    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    if (sender === botJid) return;

    let body = '';
    const msg = mek.message;
    if (msg.conversation) body = msg.conversation;
    else if (msg.extendedTextMessage?.text) body = msg.extendedTextMessage.text;
    else if (msg.imageMessage?.caption) body = msg.imageMessage.caption;
    else if (msg.videoMessage?.caption) body = msg.videoMessage.caption;
    else return;

    const links = extractLinks(body);
    if (links.length === 0 || links.every(isAllowedLink)) return;

    if (!global.ANTILINK_WARN[from]) global.ANTILINK_WARN[from] = {};
    if (!global.ANTILINK_WARN[from][senderNumber]) global.ANTILINK_WARN[from][senderNumber] = 0;
    global.ANTILINK_WARN[from][senderNumber]++;

    const action = global.ANTILINK_ACTION[from] || 'warn';
    const warnCount = global.ANTILINK_WARN[from][senderNumber];
    const maxWarns = 3;

    try { await conn.sendMessage(from, { delete: mek.key }); } catch (e) {}

    await conn.sendMessage(from, {
        text: `🔗 Link detected: \`${links.slice(0,2).join(' ')}\`\nUser: @${senderNumber}\nWarn: ${warnCount}/${maxWarns}`,
        mentions: [sender]
    });

    if (action === 'kick' && warnCount >= maxWarns) {
        try {
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, { text: `👢 Kicked @${senderNumber} for links.`, mentions: [sender] });
            delete global.ANTILINK_WARN[from][senderNumber];
        } catch (e) {}
    }
});
console.log('✅ Anti-Link Handler Loaded');
