export const removeBackup = async (message, options) => {
    //check if user is allowed to use this.
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;
    if (!options.backupID) {
        return message.channel.send(new Discord.MessageEmbed()
            .setColor('#ff00ff')
            .setAuthor(message.author.tag)
            .setTitle(":x: Load Backup")
            .setDescription("You must specify a valid backup ID.\ne.g. `n!remove -b 1234567890`")
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