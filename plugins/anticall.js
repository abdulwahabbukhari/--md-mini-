const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "anticall",
    alias: ["acall"],
    desc: "Auto reject calls (on/off)",
    category: "owner",
    react: "📵",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("❌ Owner only!");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        config.ANTI_CALL = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply("✅ *ANTI-CALL* enabled. All incoming calls will be rejected.");
    } else if (value === 'off' || value === 'false') {
        config.ANTI_CALL = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply("✅ *ANTI-CALL* disabled. Calls will ring normally.");
    } else {
        reply(`*Current Status:* ${config.ANTI_CALL || 'false'}\n\nCommands:\n.anticall on  -> Enable auto reject\n.anticall off -> Disable auto reject`);
    }
});
