// ============================================
// 🚫 ANTI-BAD WORDS - COMMAND
// 👑 Developer: SYED ABDUL WAHAB BUKHARI
// ============================================

const { arslan } = require('../arslan');

// ─── BAD WORDS LISTS (Shared) ───
const BAD_WORDS = [
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap',
    'dick', 'pussy', 'cock', 'whore', 'slut', 'bastard', 'motherfucker',
    'nigga', 'nigger', 'retard', 'idiot', 'stupid', 'dumb',
    'bhosdi', 'bhosri', 'chutiya', 'chut', 'gand', 'gaand',
    'madarchod', 'behenchod', 'bhenchod', 'lode', 'lund',
    'kutti', 'kutta', 'harami', 'nalayak', 'hijda',
    'bsdk', 'mc', 'bc', 'mkc', 'bkc', 'rndi', 'randi',
    'chutiyapa', 'bhosdike', 'bhosdiwale', 'madarchod',
    'bhenkelode', 'bhenkelund', 'teri maa ki', 'teri behan ki'
];

const BAD_PATTERNS = [
    /f[uck]+/gi, /s[h!]?it/gi, /b[i!]tch/gi, /a[s$]sho[l!]e/gi,
    /b[s$]dk/gi, /mc/gi, /bc/gi, /mkc/gi, /bkc/gi,
    /chutiya/gi, /g[a@]nd/gi, /l[u@]nd/gi, /r[a@]ndi/gi, /h[a@]rami/gi
];

// ─── MAIN COMMAND ───
arslan({
    pattern: "antibad",
    alias: ["ab", "badword", "filterbad", "badfilter"],
    desc: "🚫 Anti-Bad Words System for groups",
    category: "admin",
    react: "🚫",
    filename: __filename
}, async (arslan, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, reply, args, prefix }) => {

    if (!isGroup) return reply("❌ This command only works in groups.");
    if (!isAdmins && !isOwner) return reply("❌ You need to be an admin.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to enable anti-bad words.");

    // Init globals
    if (!global.ANTIBAD_STATUS) global.ANTIBAD_STATUS = {};
    if (!global.ANTIBAD_ACTION) global.ANTIBAD_ACTION = {};
    if (!global.ANTIBAD_WARN) global.ANTIBAD_WARN = {};

    const action = args[0]?.toLowerCase() || '';
    const actionType = args[1]?.toLowerCase() || 'warn';

    // ─── STATUS DISPLAY ───
    if (!action || (action !== 'on' && action !== 'off')) {
        const status = global.ANTIBAD_STATUS[from] ? '✅ ON' : '❌ OFF';
        const mode = global.ANTIBAD_ACTION[from] || 'warn';
        return reply(`🚫 *Anti-Bad Words System*

📌 *Status:* ${status}
⚡ *Action:* ${mode.toUpperCase()}

📌 *Commands:*
• ${prefix}antibad on warn   - Warn on bad words
• ${prefix}antibad on delete - Delete bad words
• ${prefix}antibad on kick   - Kick on bad words
• ${prefix}antibad off       - Disable system

💖 Powered by SYED-MD`);
    }

    // ─── TURN ON ───
    if (action === 'on') {
        global.ANTIBAD_STATUS[from] = true;
        global.ANTIBAD_ACTION[from] = actionType || 'warn';
        const actionMsg = {
            'warn': '⚠️ Warn user',
            'delete': '🗑️ Delete + Warn',
            'kick': '👢 Kick + Warn'
        }[actionType] || '⚠️ Warn user';

        await reply(`✅ *Anti-Bad Activated!*
📌 Action: ${actionMsg}
🔹 Bad words will be filtered.`);

        // Send fancy notification
        await arslan.sendMessage(from, {
            text: `╭────────────────────◇
│✦ *🚫 ANTI-BAD ACTIVATED* 🔥
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
        global.ANTIBAD_STATUS[from] = false;
        delete global.ANTIBAD_ACTION[from];
        await reply(`❌ *Anti-Bad Deactivated!*
Bad words will no longer be filtered.`);
    }
});

// ─── EXPORT LISTS FOR HANDLER ───
module.exports = { BAD_WORDS, BAD_PATTERNS };
