const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "setprefix",
    desc: "Change bot prefix (or use 'noprefix')",
    category: "settings",
    react: "👑"
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    let newPrefix = args[0];

    if (newPrefix) {
        if (newPrefix.toLowerCase() === 'noprefix') {
            newPrefix = '';
        } else if (newPrefix.length > 1) {
            return reply("❌ Prefix must be a single character (or 'noprefix')");
        }
        config.PREFIX = newPrefix;
        await updateUserConfigInMongoDB(botNumber, config);
        const display = newPrefix || '(no prefix)';
        reply(`✅ *PREFIX* updated to: *${display}*`);
    } else {
        const display = config.PREFIX || '(none)';
        reply(`*ABHI PREFIX ❮ ${display} ❯ HAI ☺️*\n*.setprefix .*  → dot\n*.setprefix !*  → exclamation\n*.setprefix noprefix* → remove prefix`);
    }
});
