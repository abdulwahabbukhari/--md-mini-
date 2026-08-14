// ============================================
// 🔗 ANTI-LINK - SYED-MD MINI
// 👑 Developer: SYED ABDUL WAHAB BUKHARI
// 🔥 Auto delete links + Warn + Kick
// ============================================

const { arslan } = require('../arslan');

// ─── ALLOWED DOMAINS ───
const ALLOWED_DOMAINS = [
    'whatsapp.com',
    'wa.me',
    'youtube.com',
    'youtu.be',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'github.com',
    'google.com',
    'drive.google.com'
];

// ─── LINK PATTERNS ───
const LINK_PATTERNS = [
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
];

// ─── CHECK IF LINK IS ALLOWED ───
function isAllowedLink(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        return ALLOWED_DOMAINS.some(domain => hostname.includes(domain));
    } catch {
        return false;
    }
}

// ─── EXTRACT LINKS FROM TEXT ───
function extractLinks(text) {
    const links = [];
    for (const pattern of LINK_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                if (!links.includes(match)) {
                    links.push(match);
                }
            }
        }
    }
    return links;
}

// ============================================
// 📌 MAIN COMMAND
// ============================================
arslan({
    pattern: "antilink",
    alias: ["al", "nolink", "linkfilter"],
    desc: "🔗 Anti-Link System for groups",
    category: "admin",
    react: "🔗",
    filename: __filename
}, async (arslan, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, reply, args, prefix }) => {

    if (!isGroup) return reply("❌ This command only works in groups.");
    if (!isAdmins && !isOwner) return reply("❌ You need to be an admin.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to enable anti-link.");

    // Init globals
    if (!global.ANTILINK_STATUS) global.ANTILINK_STATUS = {};
    if (!global.ANTILINK_ACTION) global.ANTILINK_ACTION = {};
    if (!global.ANTILINK_WARN) global.ANTILINK_WARN = {};

    const action = args[0]?.toLowerCase() || '';
    const actionType = args[1]?.toLowerCase() || 'warn';

    // ─── STATUS DISPLAY ───
    if (!action || (action !== 'on' && action !== 'off')) {
        const status = global.ANTILINK_STATUS[from] ? '✅ ON' : '❌ OFF';
        const mode = global.ANTILINK_ACTION[from] || 'warn';
        return reply(`🔗 *Anti-Link System*

📌 *Status:* ${status}
⚡ *Action:* ${mode.toUpperCase()}

📌 *Commands:*
• ${prefix}antilink on warn   - Warn on links
• ${prefix}antilink on delete - Delete links
• ${prefix}antilink on kick   - Kick on links
• ${prefix}antilink off       - Disable system

💖 Powered by SYED-MD`);
    }

    // ─── TURN ON ───
    if (action === 'on') {
        global.ANTILINK_STATUS[from] = true;
        global.ANTILINK_ACTION[from] = actionType || 'warn';
        const actionMsg = {
            'warn': '⚠️ Warn user',
            'delete': '🗑️ Delete + Warn',
            'kick': '👢 Kick + Warn'
        }[actionType] || '⚠️ Warn user';

        await reply(`✅ *Anti-Link Activated!*
📌 Action: ${actionMsg}
🔹 Links will be filtered (except allowed).`);

        await arslan.sendMessage(from, {
            text: `╭────────────────────◇
│✦ *🔗 ANTI-LINK ACTIVATED* 🔥
│✦ Group: ${mek.pushName || 'Unknown'}
│✦ Status: ✅ ON
│✦ Action: ${actionMsg}
│✦ Admin: @${mek.key.participant?.split('@')[0] || 'Unknown'}
╰────────────────────○
*© Powered by SYED-MD*`,
            mentions: [mek.key.participant]
        });

    // ─── TURN OFF ───
    } else if (action === 'off') {
        global.ANTILINK_STATUS[from] = false;
        delete global.ANTILINK_ACTION[from];
        await reply(`❌ *Anti-Link Deactivated!*
Links will no longer be filtered.`);
    }
});

// ─── EXPORT SHARED FUNCTIONS FOR HANDLER ───
module.exports = { ALLOWED_DOMAINS, LINK_PATTERNS, isAllowedLink, extractLinks };
