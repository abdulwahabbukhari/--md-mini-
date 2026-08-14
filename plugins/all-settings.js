const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database'); // ✅ FIXED import

// Helper function to update config in memory and database
const updateConfig = async (key, value, botNumber, config, reply) => {
    try {
        config[key] = value;
        const newConfig = { ...config }; 
        newConfig[key] = value;
        
        await updateUserConfigInMongoDB(botNumber, newConfig);
        
        return reply(`✅ *${key}* has been updated to: *${value}*`);
    } catch (e) {
        console.error(e);
        return reply("❌ Error while saving to database.");
    }
};

// ============================================================
// 1. PRESENCE MANAGEMENT
// ============================================================

cmd({
    pattern: "autorecording",
    alias: ["autorec", "arecording"],
    desc: "Enable/Disable auto recording simulation",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_RECORDING', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_RECORDING', 'false', botNumber, config, reply);
    } else {
        reply(`*ABHI :❯ ${config.AUTO_RECORDING} HAI 😊*\n\n*AUTO RECORDING ON KARNE K LIE LIKHO ☺️*\n*👑 ❮AUTORECORDING ON❯ 👑*\n*AUTORECORDING OFF KARNE K LIE LIKHO ☺️*\n*👑 ❮AUTORECORDING OFF❯ 👑*`);
    }
});

cmd({
    pattern: "autotyping",
    alias: ["autotype", "atyping"],
    desc: "Enable/Disable auto typing simulation",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_TYPING', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_TYPING', 'false', botNumber, config, reply);
    } else {
        reply(`*ABHI :❯ ${config.AUTO_TYPING} HAI 😊*\n\n*AUTO TYPING ON KARNE K LIE LIKHO ☺️*\n*👑 ❮AUTOTYPING ON❯ 👑*\n*AUTOTYPING OFF KARNE K LIE LIKHO ☺️*\n*👑 ❮AUTOTYPING OFF❯ 👑*`);
    }
});

// ============================================================
// 2. CALL MANAGEMENT
// ============================================================

cmd({
    pattern: "anticall",
    alias: "acall",
    desc: "Auto reject calls",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI ☺️*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('ANTI_CALL', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('ANTI_CALL', 'false', botNumber, config, reply);
    } else {
        reply(`*ABHI :❯ ${config.ANTI_CALL} HAI 😊*\n\n*JO BHI CALL KARE GA KHUD HI REJECT HO JAYE GE 😃 YE SETTING ON KARNE K LIE LIKHO ☺️*\n*👑 ❮ANTICALL ON❯ 👑*\n*ANTICALL OFF KARNE K LIE LIKHO ☺️*\n*👑 ❮ANTICALL OFF❯ 👑*`);
    }
});

// ============================================================
// 3. GROUP MANAGEMENT
// ============================================================

cmd({
    pattern: "welcome",
    desc: "Enable/Disable welcome messages",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('WELCOME', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('WELCOME', 'false', botNumber, config, reply);
    } else {
        reply(`*ABHI :❯ ${config.WELCOME} HAI 😊*\n\n*JO NEW MEMBER GROUP JOIN KARE GA USKA WELCOME MSG BHEJ DYA JAYE GA 😃 YEH SETTING ON KARNE K LIE LIKHO ☺️*\n*👑 ❮WECOME ON❯ 👑*\n*WELCOME OFF KARNE K LIE LIKHO ☺️*\n*👑 ❮WELCOME OFF❯ 👑*`);
    }
});

cmd({
    pattern: "goodbye",
    desc: "Enable/Disable goodbye messages",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('GOODBYE', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('GOODBYE', 'false', botNumber, config, reply);
    } else {
        reply(`*ABHI :❯ ${config.GOODBYE} HAI 😊*\n\n*JO MEMBER GROUP LEFT KARE GA USKA GOODBYE MSG BHEJ DYA JAYE GA 😃 YEH SETTING ON KARNE K LIE LIKHO ☺️*\n*👑 ❮GOODBYE ON❯ 👑*\n*GOODBYE OFF KARNE K LIE LIKHO ☺️*\n*👑 ❮GOODBYE OFF❯ 👑*`);
    }
});

// ============================================================
// 4. READ & STATUS MANAGEMENT
// ============================================================

cmd({
    pattern: "autoread",
    desc: "Enable/Disable auto read messages (Blue Tick)",
    category: "settings",
    react: "👀"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('READ_MESSAGE', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('READ_MESSAGE', 'false', botNumber, config, reply);
    } else {
        reply(`*ABHI ${config.READ_MESSAGE} HAI 😊*\n*JO BHI MSG KARE GA USKA MSG KHUD HI SEEN HO JAYE GA*\n*👑 ❮AUTOREAD ON❯ 👑*\n*👑 ❮AUTOREAD OFF❯ 👑*`);
    }
});

cmd({
    pattern: "autoviewsview",
    alias: ["avs", "statusseen", "astatus"],
    desc: "Auto view status updates",
    category: "settings",
    react: "😎"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_STATUS_SEEN', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_STATUS_SEEN', 'false', botNumber, config, reply);
    } else {
        reply(`*ABHI ${config.AUTO_STATUS_SEEN} HAI 😊*\n\n*JO BHI STATUS LAGAYE GA KHUD HI SEEN HO JAYE GA 😃 YEH SETTING ON KARNE K LIE LIKHO ☺️*\n*👑 ❮AUTOSTATUSVIEW ON❯ 👑*\n*OFF KARNE KE LIE LIKHO ☺️*\n*👑 ❮AUTOSTATUSVIEW OFF❯ 👑*`);
    }
});

cmd({
    pattern: "autolikestatus",
    alias: ["als"],
    desc: "Auto like/react status updates",
    category: "settings",
    react: "❤️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("🚫 Owner only!");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_STATUS_REACT', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_STATUS_REACT', 'false', botNumber, config, reply);
    } else {
        reply(`*ABHI ${config.AUTO_STATUS_REACT} HAI 😊*\n\n*STATUS PE REACTION (LIKE) ON KARNE KE LIE:*\n*👑 ❮AUTOLIKESTATUS ON❯ 👑*\n*OFF KARNE KE LIE:*\n*👑 ❮AUTOLIKESTATUS OFF❯ 👑*`);
    }
});

// ============================================================
// 5. SYSTEM (Mode & Prefix)
// ============================================================

cmd({
    pattern: "mode",
    desc: "Change bot mode (public/private/groups/inbox)",
    category: "settings",
    react: "⚙️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    const mode = args[0]?.toLowerCase();
    const validModes = ['public', 'private', 'groups', 'inbox'];

    if (validModes.includes(mode)) {
        await updateConfig('MODE', mode, botNumber, config, reply);
        config.WORK_TYPE = mode;
        await updateUserConfigInMongoDB(botNumber, config);
        return reply(`✅ *Mode* updated to: *${mode}*`);
    } else {
        reply(`*GHALAT LIKHA HAI 🥺*\n*ESE LIKHO ☺️*COMMAND ❮MODE❯ LIKH KER IN ME SE KOI EK WORD LIKHO JAHA AP CHAHTE HO K BOT WORK KRE 🤗*\n ${validModes.join(', ')}\nCurrent: ${config.MODE || config.WORK_TYPE}`);
    }
});

cmd({
    pattern: "setprefix",
    desc: "Change bot prefix",
    category: "settings",
    react: "👑"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*YEH COMMAND SIRF MERE LIE HAI 😎*");
    let newPrefix = args[0];

    if (newPrefix) {
        if (newPrefix.toLowerCase() === 'noprefix') {
            newPrefix = '';
        } else if (newPrefix.length > 1) {
            return reply("❌ Prefix must be a single character (or 'noprefix')");
        }
        
        await updateConfig('PREFIX', newPrefix, botNumber, config, reply);
    } else {
        const displayPrefix = config.PREFIX || '(none)';
        reply(`*ABHI PREFIX ❮ ${displayPrefix} ❯ HAI ☺️*\nJIS BHI NISHAN AP BOT CHALANA CHAHTE HAI WO NISHAN SET KERE ESE 😊*\n*❮SETPREFIX . ! + _ -❯*\n*YA 'noprefix' LIKHO TO PREFIX HAT JAYEGA*\n*JO BHI APKA DIL KARE 😍❣️*`);
    }
});
