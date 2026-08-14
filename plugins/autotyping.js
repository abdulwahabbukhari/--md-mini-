const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "autotyping",
    alias: ["autotype", "atyping"],
    desc: "Enable/Disable auto typing simulation",
    category: "settings",
    react: "⌨️"
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        config.AUTO_TYPING = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO TYPING* enabled. Bot will show "typing..."');
    } else if (value === 'off' || value === 'false') {
        config.AUTO_TYPING = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO TYPING* disabled.');
    } else {
        reply(`*ABHI :❯ ${config.AUTO_TYPING} HAI 😊*\n\n*.autotyping on*  → Show typing indicator\n*.autotyping off* → Hide typing`);
    }
});
