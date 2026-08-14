const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "welcome",
    desc: "Enable/Disable welcome messages for new members",
    category: "settings",
    react: "👋"
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        config.WELCOME = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *WELCOME* enabled. New members will be greeted.');
    } else if (value === 'off' || value === 'false') {
        config.WELCOME = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *WELCOME* disabled.');
    } else {
        reply(`*ABHI :❯ ${config.WELCOME} HAI 😊*\n\n*.welcome on*  → Greet new members\n*.welcome off* → Disable welcome`);
    }
});
