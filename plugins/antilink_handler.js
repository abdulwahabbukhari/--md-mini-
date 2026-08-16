const { cmd } = require('../arslan');
const { isAllowedLink, extractLinks } = require('./antilink.js');

cmd({
    pattern: "antilink_handler",
    on: "body",
    filename: __filename
    // ⬇️ category nahi di, desc nahi di → MENU SE CHUP JAYEGI
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
console.log('✅ Anti-Link Handler Loaded (Hidden from Menu)'); 
