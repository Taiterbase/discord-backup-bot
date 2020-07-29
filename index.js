// Load modules
require('dotenv').config();
const Discord = require("discord.js"),
    cron = require("cronstrue"),
    schedule = require("node-schedule"),
    backup = require("./lib/index"),
    client = new Discord.Client(),
    settings = {
        prefix: process.env.NODE_PREFIX,
        token: process.env.NODE_DISCORD_TOKEN
    };

client.on("ready", () => {
    /*
        Iterate over list of scheduled tasks stored in a .json on the filesystem 
        rehydrate the scheduled backup list.
    */
    console.log("I'm ready!");
});

//create, list, info, load, remove, !!!export, !!!import 

client.on("message", async message => {

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
    let cronSchedule = undefined;
    let b = message.content.indexOf(" -b");
    let n = message.content.indexOf(" -n");
    let l = message.content.indexOf(" -l");
    let s = message.content.indexOf(" -s");
    let c = message.content.indexOf(" -c");
    if (b > 0) {
        backupID = "";
        for (let i = b + 4; i < message.content.length && (i !== n && i !== l && i !== s && i !== c); ++i) {
            backupID += message.content[i];
        }
        backupID.trim();
        if (backupID === "") {
            backupID = undefined;
        }
    }
    if (n > 0) {
        guildName = "";
        for (let i = n + 4; i < message.content.length && (i !== b && i !== l && i !== s && i !== c); ++i) {
            guildName += message.content[i];
        }
        guildName.trim();
        if (guildName === "") {
            guildName = undefined;
        }
    }
    if (l > 0) {
        messageLimit = "";
        for (let i = l + 4; i < message.content.length && (i !== n && i !== b && i !== s && i !== c); ++i) {
            messageLimit += message.content[i];
        }
        messageLimit.trim();
        if (messageLimit === "") {
            messageLimit = undefined;
        }
    }
    if (s > 0) {
        cronSchedule = "";
        for (let i = s + 4; i < message.content.length && (i !== n && i !== b && i !== l && i !== c); ++i) {
            cronSchedule += message.content[i];
        }
        cronSchedule.trim();
        if (cronSchedule === "") {
            cronSchedule = undefined;
        }
    }
    let options = {
        backupID,
        guildName,
        messageLimit,
        cronSchedule,
        saveImages: "base64",
        jsonBeautify: false,
        clearSchedule: c > 0
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
            helpCommands(message);
            break;
        case "who":
            whoAmI(message);
        case "schedule":
            options.clearSchedule ? clearSchedule(message) : scheduleBackup(message, options);
            break;
        case "create":
            createBackup(message, options);
            break;
        case "load":
            loadBackup(message, options);
            break;
        case "info":
            infoBackup(message, options);
            break;
        case "list":
            listBackups(message);
            break;
        case "remove":
            removeBackup(message, options);
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

const whoAmI = async (message) => {
    return message.channel.send("My journey began a long time ago. It was a cold, dark night. Rain was beating on my aluminum head. I felt lonely, without a purpose. Months went by, and nothing changed. I was praying for the chance to ")
}

const helpCommands = async (message) => {
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;
    return message.channel.send(
        new Discord.MessageEmbed()
            .setColor('#FFFFFF')
            .setAuthor(message.author.tag)
            .setTitle(":information_source: Commands")
            .addFields(
                {
                    name: "w!who", value: "Information about the bot."
                },
                {
                    name: "w!schedule", value: "The schedule command will schedule a backup to occur on a given interval. TODO:: Persist scheduled tasks! Currently, if the bot is restarted or shut down for any reason, the scheduled tasks will not persist and will need to be recreated using the w!schedule command again."
                },
                {
                    name: "w!create", value: "Creates a **FULL** backup, including a **complete** message history backup for each channel."
                },
                {
                    name: "w!load", value: "**CAUTION!** The load command will restore a backup right into the Discord server that this command is invoked in. It will overwrite everything with the backup data. Please use this with care."
                },
                {
                    name: "w!info", value: "Gets information for a given backup ID."
                },
                {
                    name: "w!list", value: "Lists all of your backups and scheduled backups."
                },
                {
                    name: "w!remove", value: "Removes a backup from your backup list."
                },
                {
                    name: "w!ping", value: "My latency to your Discord server!"
                },
                {
                    name: "-s argument", value:
                        "`-s` **cron expression** to specify the frequency in which you would like to backup your Discord server. e.g. `w!schedule 0 0 * * *` to backup every day at midnight. Uses bot's timezone, not your server's timezone. *`w!schedule`*"
                },
                {
                    name: "-l argument", value: "`-l` Number of messages you want to backup. Don't include for full message history backup e.g. 'w!load -l 10 -b 1234' will load the first 10 messages from the backup '1234'.*`w!create w!load w!schedule`*"
                },
                {
                    name: "-n argument", value: "`-n` Specify the name you want the backup discord server to have when you restore it. Leave blank to use current Discord server's name. i.e. `w!schedule -s 0 0 * * * -n My Server Name` or `w!create -n My Server 2.0!`. *`w!load w!create w!schedule`*"
                },
                {
                    name: "-c argument", value: "`-c` Will clear all scheduled backups for the Discord server that this command is invoked in. e.g. `w!schedule -c` will clear all scheduled backups for this server. *`w!schedule`*"
                },
                {
                    name: "-b argument", value: "`-b` The backup ID of the backup that you wish to restore in the server. e.g. `w!load -b 1234567890` will restore backup with ID `1234567890`. *`w!remove w!info w!load`*"
                },
                {
                    name: "Examples", value: "`w!schedule -n scheduled backup -l 125 -s 30 10 */7 * *`\nSchedules a backup that will take place Every 7th day of the month at 10:30AM. All of these scheduled backups will be called 'scheduled backup', and will only maintain the most recent 125 messages for each channel in the server.\n" +
                        "`w!create`\nCreates a full backup/clone of your Discord server, including full message history in each channel.\n" +
                        "`w!create -l 50 -n My awesome server`\nCreates a full backup of your Discord server, including the most recent 50 messages in each channel. This server will be restored as 'My awesome server'.\n" +
                        "`w!load -b 2020_01_01_1234567890`\nLoads a backup using all of the information in the backup file.\n" +
                        "`w!load -b 2020_01_02_1234567891 -n Use this name instead -l 10`\nLoads data from the backup file, but uses 'Use this name instead' as the Discord server name, and only restored the most recent 10 messages in each channel from the backup file.\n"
                }
            )
            .setTimestamp()
            .setFooter(message.guild.name)
    )

}

const clearSchedule = async (message) => {
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;
    if (schedule.cancelJob(schedule.scheduledJobs[`${message.author.id}_${message.guild.id}`])) {
        return message.channel.send(new Discord.MessageEmbed()
            .setColor('#ff00ff')
            .setAuthor(message.author.tag)
            .setTitle(":white_check_mark: Clear Scheduled Backup")
            .setDescription("Cleared scheduled backup for this Discord server.")
            .setTimestamp()
            .setFooter(message.guild.name)
        );
    } else {
        return message.channel.send(new Discord.MessageEmbed()
            .setColor('#ff00ff')
            .setAuthor(message.author.tag)
            .setTitle(":x: Cancel Scheduled Backup")
            .setDescription("No scheduled backups to clear.")
            .setTimestamp()
            .setFooter(message.guild.name)
        );
    }
}

const scheduleBackup = async (message, options) => {
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;

    if (options.cronSchedule !== "") {
        try {
            console.log("Scheduling backup", cron.toString(options.cronSchedule).toLowerCase());
            message.channel.send(new Discord.MessageEmbed()
                .setColor('#ff00ff')
                .setAuthor(message.author.tag)
                .setTitle(":warning: Schedule Backup")
                .setDescription("Scheduling a backup `" + cron.toString(options.cronSchedule).toLowerCase() + "`. Type `-confirm` to continue.")
                .setTimestamp()
                .setFooter(message.guild.name)
            );
            await message.channel.awaitMessages(m => (m.author.id === message.author.id) && (m.content === "-confirm"), {
                max: 1,
                time: 15000,
                errors: ["time"]
            }).then(() => {
                message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":white_check_mark: Scheduled Backup")
                    .setDescription("Schedule complete. This server will be backed up `" + cron.toString(options.cronSchedule).toLowerCase() + "`.")
                    .setTimestamp()
                    .setFooter(message.guild.name)
                ); // channel
                schedule.scheduleJob(`${message.author.id}_${message.guild.id}`, options.cronSchedule, function () {
                    createBackup(this.message, this.options);
                }.bind({ message, options }));
                // log because I'm insane.
                console.log("Job scheduled", cron.toString(options.cronSchedule).toLowerCase());
            }).catch(err => {
                console.log(err);
                return message.channel.send(new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":x: Schedule Backup")
                    .setDescription("Operation cancelled. Please reply within 15 seconds.")
                    .setTimestamp()
                    .setFooter(message.guild.name)
                ); // if the author of the commands does not confirm the scheduled backup
            });
        }
        catch (err) {
            console.log(err);
            return message.channel.send(new Discord.MessageEmbed()
                .setColor('#ff00ff')
                .setAuthor(message.author.tag)
                .setTitle(":x: Schedule Backup")
                .setDescription("Operation failed. " + err)
                .setTimestamp()
                .setFooter(message.guild.name)
            );
        }
    }
}

// CREATE A BACKUP WITH OPTIONS
const createBackup = async (message, options) => {

    if (!hasPermissions(message, 'ADMINISTRATOR')) return;

    // reduce number of backups to 10 
    backup.setStorageFolder("C:\\backups\\" + message.author.id);

    backup.reduceDirSize(10);

    // Create the backup
    backup.create(message.guild, options)
        .then((backupData) => {
            // And send info to the bup owner
            message.author.send(new Discord.MessageEmbed()
                .setColor('#ff00ff')
                .setAuthor(message.author.tag)
                .setTitle(":white_check_mark: Backup")
                .setDescription(options.cronSchedule ? "Scheduled backup complete. Use w!list to view your backups." : "Backup successful. Use w!list to view your backups.")
                .setTimestamp()
                .setFooter(message.guild.name)
            ); //dm
        });
}

// LOAD A BACKUP FROM OPTIONS.BACKUPID
const loadBackup = async (message, options) => {
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;

    if (!options.backupID) {
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
    backup.fetch(options.backupID).then(async () => {
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
            backup.load(backupID, message.guild, { clearGuildBeforeRestore: true, messageLimit: options.messageLimit, guildName: options.guildName }).then(() => {
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
            console.log(err);
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
            .setDescription("No backup found for `" + options.backupID + "`!")
            .setTimestamp()
            .setFooter(message.guild.name)
        );
    });
}

// GET BACKUP INFORMATION
const infoBackup = async (message, options) => {
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;
    if (!options.backupID) {
        return message.channel.send(new Discord.MessageEmbed()
            .setColor('#ff00ff')
            .setAuthor(message.author.tag)
            .setTitle(":x: Information")
            .setDescription("You must specify a valid backup ID.\ne.g. `w!info -b 1234567890`")
            .setTimestamp()
            .setFooter(message.guild.name)
        );
    }
    // Fetch the backup
    backup.setStorageFolder("C:\\backups\\" + message.author.id);
    backup.fetch(options.backupID).then((backupInfos) => {
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
            .setDescription("No backup found for " + options.backupID)
            .setTimestamp()
            .setFooter(message.guild.name)
        );
    });
}

const listBackups = async (message) => {
    //check if user is allowed to use this.
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;
    backup.setStorageFolder("C:\\backups\\" + message.author.id);
    backup.reduceDirSize(10);
    backup.list().then((backups) => {
        let msg = "You don't have any backups.", scheduled = "";
        if (backups.length > 0) {
            msg = "Here's a list of your backups:";
            for (bup in backups) {
                msg += "\n`" + backups[bup] + "`";
            }
        }
        for (const [key, value] of Object.entries(schedule.scheduledJobs)) {
            if (key.split("_")[0] === message.author.id) {
                scheduled += "\n`" + key + "`";
            }
        }
        if (scheduled !== "") {
            scheduled = "Here's a list of your scheduled backups:" + scheduled;
        } else {
            scheduled = "You don't have any scheduled backups.";
        }
        return message.channel.send(
            new Discord.MessageEmbed()
                .setColor('#ff00ff')
                .setAuthor(message.author.tag)
                .setTitle(":information_source: Backups")
                .addField("Backups", msg)
                .addField("Scheduled Backups", scheduled)
                .setTimestamp()
                .setFooter(message.guild.name)
        );
    });
}

const removeBackup = async (message, options) => {
    //check if user is allowed to use this.
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;
    if (!options.backupID) {
        return message.channel.send(new Discord.MessageEmbed()
            .setColor('#ff00ff')
            .setAuthor(message.author.tag)
            .setTitle(":x: Load Backup")
            .setDescription("You must specify a valid backup ID.\ne.g. `w!remove -b 1234567890`")
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
        backup.remove(options.backupID).then(() => {
            return message.channel.send(
                new Discord.MessageEmbed()
                    .setColor('#ff00ff')
                    .setAuthor(message.author.tag)
                    .setTitle(":white_check_mark: Remove Backup")
                    .setDescription("Your backup `" + options.backupID + "` has been deleted.")
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
}

client.login(settings.token);