const { cmd } = require('../arslan');

const BAD_WORDS = [
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap',
    'bhosdi', 'bhosri', 'chutiya', 'chut', 'gand', 'gaand',
    'madarchod', 'behenchod', 'bhenchod', 'lode', 'lund',
    'kutti', 'kutta', 'harami', 'nalayak', 'hijda',
    'bsdk', 'mc', 'bc', 'mkc', 'bkc', 'rndi', 'randi'
];

const BAD_PATTERNS = [
    /f[uck]+/gi, /s[h!]?it/gi, /b[i!]tch/gi,
    /b[s$]dk/gi, /mc/gi, /bc/gi, /mkc/gi, /bkc/gi,
    /chutiya/gi, /g[a@]nd/gi, /l[u@]nd/gi, /r[a@]ndi/gi
];

cmd({
    pattern: "antibad",
    alias: ["ab", "badword", "filterbad"],
    desc: "🚫 Anti-Bad Words System for groups",
    category: "admin",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, reply, args, prefix }) => {
    if (!isGroup) return reply("❌ Only works in groups.");
    if (!isAdmins && !isOwner) return reply("❌ You need to be an admin.");
    if (!isBotAdmins) return reply("❌ I need to be an admin.");

    if (!global.ANTIBAD_STATUS) global.ANTIBAD_STATUS = {};
    if (!global.ANTIBAD_ACTION) global.ANTIBAD_ACTION = {};
    if (!global.ANTIBAD_WARN) global.ANTIBAD_WARN = {};

    const action = args[0]?.toLowerCase() || '';
    const actionType = args[1]?.toLowerCase() || 'warn';

    if (!action || (action !== 'on' && action !== 'off')) {
        const status = global.ANTIBAD_STATUS[from] ? '✅ ON' : '❌ OFF';
        const mode = global.ANTIBAD_ACTION[from] || 'warn';
        return reply(`🚫 *Anti-Bad System*
Status: ${status} | Action: ${mode}
Commands:
${prefix}antibad on warn   - Warn
${prefix}antibad on delete - Delete
${prefix}antibad on kick   - Kick
${prefix}antibad off       - Disable`);
    }

    if (action === 'on') {
        global.ANTIBAD_STATUS[from] = true;
        global.ANTIBAD_ACTION[from] = actionType;
        const actionMsg = { 'warn': 'Warn', 'delete': 'Delete+Warn', 'kick': 'Kick+Warn' }[actionType] || 'Warn';
        await reply(`✅ Anti-Bad ON! Action: ${actionMsg}`);
        await conn.sendMessage(from, {
            text: `🚫 Anti-Bad ACTIVATED\nAction: ${actionMsg}\nAdmin: @${mek.key.participant?.split('@')[0]}`,
            mentions: [mek.key.participant]
        });
    } else if (action === 'off') {
        global.ANTIBAD_STATUS[from] = false;
        delete global.ANTIBAD_ACTION[from];
        await reply(`❌ Anti-Bad OFF.`);
    }
});
