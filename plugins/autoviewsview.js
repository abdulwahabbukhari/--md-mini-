const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "autoviewsview",
    alias: ["avs", "statusseen", "astatus"],
    desc: "Auto view status updates",
    category: "settings",
    react: "👁️"
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        // ✅ Using AUTO_STATUS_SEEN (matches main.js)
        config.AUTO_STATUS_SEEN = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO STATUS VIEW* enabled. All statuses will be seen.');
    } else if (value === 'off' || value === 'false') {
        config.AUTO_STATUS_SEEN = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO STATUS VIEW* disabled.');
    } else {
        reply(`*ABHI ${config.AUTO_STATUS_SEEN} HAI 😊*\n\n*.autoviewsview on*  → Auto view status\n*.autoviewsview off* → Disable auto view`);
    }
});
