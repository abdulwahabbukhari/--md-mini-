const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "autolikestatus",
    alias: ["als"],
    desc: "Auto like/react on status updates",
    category: "settings",
    react: "❤️"
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        // ✅ Using AUTO_STATUS_REACT (matches main.js)
        config.AUTO_STATUS_REACT = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO STATUS REACT* enabled. Bot will like all statuses.');
    } else if (value === 'off' || value === 'false') {
        config.AUTO_STATUS_REACT = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO STATUS REACT* disabled.');
    } else {
        reply(`*ABHI ${config.AUTO_STATUS_REACT} HAI 😊*\n\n*.autolikestatus on*  → Auto like status\n*.autolikestatus off* → Disable auto like`);
    }
});
