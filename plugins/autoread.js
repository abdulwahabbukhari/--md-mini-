const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "autoread",
    desc: "Auto read messages (Blue Tick)",
    category: "settings",
    react: "👀"
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        config.READ_MESSAGE = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO READ* enabled. Messages will be seen automatically.');
    } else if (value === 'off' || value === 'false') {
        config.READ_MESSAGE = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO READ* disabled.');
    } else {
        reply(`*ABHI ${config.READ_MESSAGE} HAI 😊*\n*.autoread on*  → Blue ticks on\n*.autoread off* → Blue ticks off`);
    }
});
