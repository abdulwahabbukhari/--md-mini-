const { cmd } = require('../arslan');
const { BAD_WORDS, BAD_PATTERNS } = require('./antibad.js');

cmd({
    pattern: "antibad_handler",
    on: "body",
    filename: __filename
    // ⬇️ category nahi di, desc nahi di → MENU SE CHUP JAYEGI
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, isOwner, sender, senderNumber }) => {
    if (!isGroup) return;
    if (!global.ANTIBAD_STATUS?.[from]) return;
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

    let found = false, badWord = '';
    for (const word of BAD_WORDS) {
        if (body.toLowerCase().includes(word.toLowerCase())) { found = true; badWord = word; break; }
    }
    if (!found) {
        for (const pattern of BAD_PATTERNS) {
            if (pattern.test(body)) { found = true; badWord = body.match(pattern)?.[0] || 'bad word'; break; }
        }
    }
    if (!found) return;

    if (!global.ANTIBAD_WARN[from]) global.ANTIBAD_WARN[from] = {};
    if (!global.ANTIBAD_WARN[from][senderNumber]) global.ANTIBAD_WARN[from][senderNumber] = 0;
    global.ANTIBAD_WARN[from][senderNumber]++;

    const action = global.ANTIBAD_ACTION[from] || 'warn';
    const warnCount = global.ANTIBAD_WARN[from][senderNumber];
    const maxWarns = 3;

    try { await conn.sendMessage(from, { delete: mek.key }); } catch (e) {}

    await conn.sendMessage(from, {
        text: `⚠️ Bad word: \`${badWord}\`\nUser: @${senderNumber}\nWarn: ${warnCount}/${maxWarns}`,
        mentions: [sender]
    });

    if (action === 'kick' && warnCount >= maxWarns) {
        try {
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, { text: `👢 Kicked @${senderNumber} for bad words.`, mentions: [sender] });
            delete global.ANTIBAD_WARN[from][senderNumber];
        } catch (e) {}
    }
});
console.log('✅ Anti-Bad Handler Loaded (Hidden from Menu)');
