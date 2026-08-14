const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "mode",
    desc: "Change bot mode (public/private/groups/inbox)",
    category: "settings",
    react: "⚙️"
}, async (conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const mode = args[0]?.toLowerCase();
    const valid = ['public', 'private', 'groups', 'inbox'];

    if (valid.includes(mode)) {
        config.MODE = mode;
        config.WORK_TYPE = mode; // Compatibility
        await updateUserConfigInMongoDB(botNumber, config);
        reply(`✅ *Mode* updated to: *${mode}*`);
    } else {
        reply(`*GHALAT LIKHA HAI 🥺*\nOptions: ${valid.join(', ')}\nCurrent: ${config.MODE || config.WORK_TYPE}`);
    }
});
