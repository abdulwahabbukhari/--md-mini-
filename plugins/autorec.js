const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "autorecording",
    alias: ["autorec", "arecording"],
    desc: "Enable/Disable auto recording simulation",
    category: "settings",
    react: "🎙️"
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        config.AUTO_RECORDING = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO RECORDING* enabled. Bot will show "recording...".');
    } else if (value === 'off' || value === 'false') {
        config.AUTO_RECORDING = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO RECORDING* disabled.');
    } else {
        reply(`*ABHI :❯ ${config.AUTO_RECORDING} HAI 😊*\n*.autorec on*  → Show recording\n*.autorec off* → Hide recording`);
    }
});
