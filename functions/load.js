const loadBackup = async (message, options) => {
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;

    if (!options.backupID) {
        return message.channel.send(new Discord.MessageEmbed()
            .setColor('#ff00ff')
            .setAuthor(message.author.tag)
            .setTitle(":x: Load Backup")
            .setDescription("You must specify a valid backup ID.\ne.g. `n!load -b 1234567890`")
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
            backup.load(options.backupID, message.guild, { clearGuildBeforeRestore: true, messageLimit: options.messageLimit, guildName: options.guildName }).then(() => {
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