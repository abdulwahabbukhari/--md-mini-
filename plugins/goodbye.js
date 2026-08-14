const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "goodbye",
    desc: "Enable/Disable goodbye messages when members leave",
    category: "settings",
    react: "👋"
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        config.GOODBYE = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *GOODBYE* enabled. Leaving members will be noticed.');
    } else if (value === 'off' || value === 'false') {
        config.GOODBYE = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *GOODBYE* disabled.');
    } else {
        reply(`*ABHI :❯ ${config.GOODBYE} HAI 😊*\n\n*.goodbye on*  → Send goodbye messages\n*.goodbye off* → Disable goodbye`);
    }
});
