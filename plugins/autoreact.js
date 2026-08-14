const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "autoreact",
    alias: ["areact"],
    desc: "Auto react to incoming messages with random emojis",
    category: "settings",
    react: "😜"  // ✅ YAHAN REACT DIYA HUA HAI (JAB BHI COMMAND CHALE GI YEH EMOJI AAYE GA)
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();

    if (value === 'on' || value === 'true') {
        config.CUSTOM_REACT = 'true';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO REACT* enabled. Bot will react randomly to messages.');
    } else if (value === 'off' || value === 'false') {
        config.CUSTOM_REACT = 'false';
        await updateUserConfigInMongoDB(botNumber, config);
        reply('✅ *AUTO REACT* disabled.');
    } else {
        const emojis = config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔';
        reply(`*ABHI :❯ ${config.CUSTOM_REACT} HAI 😊*\nEmojis: ${emojis}\n\n*.autoreact on*  → Auto react to msgs\n*.autoreact off* → Disable auto react`);
    }
});
