// Load modules
require('dotenv').config();
const Discord = require("discord.js"),
    backup = require("./lib/index"),
    client = new Discord.Client(),
    settings = {
        prefix: process.env.NODE_PREFIX,
        token: process.env.NODE_DISCORD_TOKEN
    };

client.on("ready", () => {
    console.log("I'm ready!");
});

//create, list, info, load, remove, !!!export, !!!import

client.on("message", async message => {

    if (message.content.startsWith("<@!735189322780770315>")) {
        return message.reply("Hello!");
    }

    // This reads the first part of your message behind your prefix to see which command you want to use.
    let command = message.content.toLowerCase().slice(settings.prefix.length).split(" ")[0];
    // If the message does not start with your prefix return.
    // If the user that types a message is a bot account return.
    // If the command comes from DM return.
    if (!message.content.startsWith(settings.prefix) || message.author.bot || !message.guild) return;

    // These are the arguments behind the commands.
    let backupID = undefined;
    let messageLimit = undefined;
    let guildName = undefined;
    let b = message.content.indexOf(" -b");
    let n = message.content.indexOf(" -n");
    let l = message.content.indexOf(" -l");
    if (b > 0) {
        backupID = "";
        for (let i = b + 4; i < message.content.length && (i !== n && i !== l); ++i) {
            backupID += message.content[i];
        }
        backupID.trim();
        if (backupID === "") {
            backupID = undefined;
        }
    }
    if (n > 0) {
        guildName = "";
        for (let i = n + 4; i < message.content.length && (i !== b && i !== l); ++i) {
            guildName += message.content[i];
        }
        guildName.trim();
        if (guildName === "") {
            guildName = undefined;
        }
    }
    if (l > 0) {
        messageLimit = "";
        for (let i = l + 4; i < message.content.length && (i !== n && i !== b); ++i) {
            messageLimit += message.content[i];
        }
        messageLimit.trim();
        if (messageLimit === "") {
            messageLimit = undefined;
        }
    }
    /*
    create
    load
    list
    info
    remove

    export //sends the caller a dm containing their backups, or individual backup if an id is provided.
    */

    switch (command) {
        case "help":

            break;
        case "create":
            if (!hasPermissions(message, 'ADMINISTRATOR')) return;

            backup.setStorageFolder("C:\\backups\\" + message.author.id);
            // Create the backup
            backup.create(message.guild, { jsonBeautify: false, saveImages: 'base64', messageLimit, guildName })
                .then((backupData) => {
                    // And send informations to the backup owner
                    message.author.send(new Discord.MessageEmbed()
                        .setColor('#ff00ff')
                        .setAuthor(message.author.tag)
                        .setTitle(":white_check_mark: Backup")
                        .setDescription("Backup successful. Type this command to restore it in any server where you occupy an adminstrative role:\n`" + settings.prefix + "load " + backupData.id + "`")
                        .setTimestamp()
                        .setFooter(message.guild.name)
                    ); //dm

                    message.channel.send(new Discord.MessageEmbed()
                        .setColor('#ff00ff')
                        .setAuthor(message.author.tag)
                        .setTitle(":white_check_mark: Backup")
                        .setDescription("Backup created.")
                        .setTimestamp()
                        .setFooter(message.guild.name)
                    ); //channel
                });
            break;
        case "load":
            if (!hasPermissions(message, 'ADMINISTRATOR')) return;

            // Check member permissions
            if (!hasPermissions(message, 'ADMINISTRATOR')) return;

            if (!backupID) {
                return message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":x: Load Backup")
                    .setDescription("You must specify a valid backup ID.\ne.g. `w!load -b 1234567890`")
                    .setTimestamp()
                    .setFooter(message.guild.name)
                );
            }
            // Fetching the backup to know if it exists
            backup.setStorageFolder("C:\\backups\\" + message.author.id);
            backup.fetch(backupID).then(async () => {
                // If the backup exists, request for confirmation

                message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":warning: Load Backup")
                    .setDescription("When the backup is loaded, all the channels, roles, etc. will be replaced! Type `-confirm` to continue.")
                    .setTimestamp()
                    .setFooter(message.guild.name)
                );
                await message.channel.awaitMessages(m => (m.author.id === message.author.id) && (m.content === "-confirm"), {
                    max: 1,
                    time: 15000,
                    errors: ["time"]
                }).then(() => {
                    // When the author of the command has confirmed that they want to load the backup on their server
                    message.author.send(new Discord.MessageEmbed()
                        .setColor('#ff00ff')
                        .setAuthor(message.author.tag)
                        .setTitle(":white_check_mark: Loading")
                        .setDescription("Loading backup...")
                        .setTimestamp()
                        .setFooter(message.guild.name)
                    );
                    // Load the backup
                    backup.load(backupID, message.guild, { clearGuildBeforeRestore: true, messageLimit, guildName }).then(() => {
                        // When the backup is loaded, delete them from the server
                        //backup.remove(backupID);
                    }).catch((err) => {
                        // If an error occurred
                        return message.author.send(new Discord.MessageEmbed()
                            .setColor('#ff00ff')
                            .setAuthor(message.author.tag)
                            .setTitle(":x: Load Backup")
                            .setDescription("I need administrative privileges to load a backup.")
                            .setTimestamp()
                            .setFooter(message.guild.name)
                        );
                    });
                }).catch((err) => {
                    // if the author of the commands does not confirm the backup loading
                    return message.channel.send(new Discord.MessageEmbed()
                        .setColor('#ff00ff')
                        .setAuthor(message.author.tag)
                        .setTitle(":x: Load Backup")
                        .setDescription("Operation cancelled. Please reply within 15 seconds.")
                        .setTimestamp()
                        .setFooter(message.guild.name)
                    );
                });
            }).catch((err) => {
                console.log(err);
                // if the backup wasn't found
                return message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":x: Load Backup")
                    .setDescription("No backup found for `" + backupID + "`!")
                    .setTimestamp()
                    .setFooter(message.guild.name)
                );
            });
            break;
        case "info":
            if (!hasPermissions(message, 'ADMINISTRATOR')) return;
            if (!backupID) {
                return message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":x: Information")
                    .setDescription("You must specify a valid backup ID.\ne.g. `w!load -b 1234567890`")
                    .setTimestamp()
                    .setFooter(message.guild.name)
                );
            }
            // Fetch the backup
            backup.setStorageFolder("C:\\backups\\" + message.author.id);
            backup.fetch(backupID).then((backupInfos) => {
                const date = new Date(backupInfos.data.createdTimestamp);
                const yyyy = date.getFullYear().toString(), mm = (date.getMonth() + 1).toString(), dd = date.getDate().toString();
                const formattedDate = `${yyyy}/${(mm[1] ? mm : "0" + mm[0])}/${(dd[1] ? dd : "0" + dd[0])}`;
                message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":information_source: Information")
                    .addField("Backup ID", backupInfos.id, false)
                    .addField("Server ID", backupInfos.data.guildID, false)
                    .addField("Size", `${backupInfos.size} mb`, false)
                    .addField("Created at", formattedDate, false)
                    .setTimestamp()
                    .setFooter(message.guild.name)
                );
            }).catch((err) => {
                // if the backup wasn't found
                return message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":x: Information")
                    .setDescription("No backup found for " + backupID)
                    .setTimestamp()
                    .setFooter(message.guild.name)
                );
            });
            break;
        case "list":
            //check if user is allowed to use this.
            if (!hasPermissions(message, 'ADMINISTRATOR')) return;
            backup.setStorageFolder("C:\\backups\\" + message.author.id);
            backup.list().then((backups) => {
                let msg = undefined;
                if (backups.length > 0) {
                    msg = "Here's a list of your backups:";
                    for (bup in backups) {
                        msg += "\n`" + backups[bup] + "`";
                    }
                }
                else {
                    msg = "You don't have any backups.";
                }
                return message.channel.send(
                    new Discord.MessageEmbed()
                        .setColor('#ff00ff')
                        .setAuthor(message.author.tag)
                        .setTitle(":information_source: Backups")
                        .setDescription(msg)
                        .setTimestamp()
                        .setFooter(message.guild.name)
                );
            });
            break;
        case "remove":
            //check if user is allowed to use this.
            if (!hasPermissions(message, 'ADMINISTRATOR')) return;
            if (!backupID) {
                return message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":x: Load Backup")
                    .setDescription("You must specify a valid backup ID.\ne.g. `w!load -b 1234567890`")
                    .setTimestamp()
                    .setFooter(message.guild.name)
                );
            }
            message.channel.send(new Discord.MessageEmbed()
                .setColor('#FF00FF')
                .setAuthor(message.author.tag)
                .setTitle(":warning: Remove Backup")
                .setDescription("Are you sure you want to delete this backup? Type `-confirm` to continue.")
                .setTimestamp()
                .setFooter(message.guild.name)
            );
            await message.channel.awaitMessages(m => (m.author.id === message.author.id) && (m.content === "-confirm"), {
                max: 1,
                time: 15000,
                errors: ["time"]
            }).then(() => {
                backup.setStorageFolder("C:\\backups\\" + message.author.id);
                backup.remove(backupID).then(() => {
                    return message.channel.send(
                        new Discord.MessageEmbed()
                            .setColor('#ff00ff')
                            .setAuthor(message.author.tag)
                            .setTitle(":white_check_mark: Remove Backup")
                            .setDescription("Your backup `" + backupID + "` has been deleted.")
                            .setTimestamp()
                            .setFooter(message.guild.name)
                    );
                });
            }).catch((err) => {
                // if the author of the commands does not confirm the backup loading
                return message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":x: Load Backup")
                    .setDescription("Operation cancelled. Please reply within 15 seconds.")
                    .setTimestamp()
                    .setFooter(message.guild.name)
                );
            });
            break;
        case "ping":
            message.channel.send(new Discord.MessageEmbed()
                .setColor('#0099FF')
                .setTitle(':information_source: Pong')
                .setDescription(`My **ping** is **${Math.round(client.ws.ping)}ms**.`)
            );
            break;

    }
});

const hasPermissions = (message, role) => {
    if (!message.member.hasPermission(role)) {
        message.channel.send(new Discord.MessageEmbed()
            .setColor('#0099FF')
            .setAuthor(message.author.tag)
            .setTitle(":x: Authentication")
            .setDescription("You must be an administrator of this server to perform this operation.")
            .setTimestamp()
            .setFooter(message.guild.name)
        );
        return false;
    }
    return true;
}

client.login(settings.token);