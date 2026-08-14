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
    pattern: "antilink",
    alias: ["al", "nolink", "linkfilter"],
    desc: "🔗 Anti-Link System for groups",
    category: "admin",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, reply, args, prefix }) => {
    if (!isGroup) return reply("❌ Only in groups.");
    if (!isAdmins && !isOwner) return reply("❌ Admin required.");
    if (!isBotAdmins) return reply("❌ I need to be admin.");

    if (!global.ANTILINK_STATUS) global.ANTILINK_STATUS = {};
    if (!global.ANTILINK_ACTION) global.ANTILINK_ACTION = {};
    if (!global.ANTILINK_WARN) global.ANTILINK_WARN = {};

    const action = args[0]?.toLowerCase() || '';
    const actionType = args[1]?.toLowerCase() || 'warn';

    if (!action || (action !== 'on' && action !== 'off')) {
        const status = global.ANTILINK_STATUS[from] ? '✅ ON' : '❌ OFF';
        const mode = global.ANTILINK_ACTION[from] || 'warn';
        return reply(`🔗 *Anti-Link System*
Status: ${status} | Action: ${mode}
Commands:
${prefix}antilink on warn   - Warn
${prefix}antilink on delete - Delete
${prefix}antilink on kick   - Kick
${prefix}antilink off       - Disable`);
    }

    if (action === 'on') {
        global.ANTILINK_STATUS[from] = true;
        global.ANTILINK_ACTION[from] = actionType;
        const actionMsg = { 'warn': 'Warn', 'delete': 'Delete+Warn', 'kick': 'Kick+Warn' }[actionType] || 'Warn';
        await reply(`✅ Anti-Link ON! Action: ${actionMsg}`);
    } else if (action === 'off') {
        global.ANTILINK_STATUS[from] = false;
        delete global.ANTILINK_ACTION[from];
        await reply(`❌ Anti-Link OFF.`);
    }
});
