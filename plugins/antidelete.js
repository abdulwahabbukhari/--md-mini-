const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "antidelete",
    alias: ["ad"],
    desc: "Anti delete messages (on/off)",
    category: "owner",
    react: "🛡️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("❌ Owner only!");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        config.ANTIDELETE = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply("✅ *ANTI-DELETE* enabled. I will save deleted messages.");
    } else if (value === 'off' || value === 'false') {
        config.ANTIDELETE = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply("✅ *ANTI-DELETE* disabled.");
    } else {
        reply(`*Current Status:* ${config.ANTIDELETE || 'false'}\n\nCommands:\n.antidelete on  -> Enable anti delete\n.antidelete off -> Disable anti delete`);
    }
});
