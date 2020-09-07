export const infoBackup = async (message, options) => {
    if (!hasPermissions(message, 'ADMINISTRATOR')) return;
    if (!options.backupID) {
        return message.channel.send(new Discord.MessageEmbed()
            .setColor('#ff00ff')
            .setAuthor(message.author.tag)
            .setTitle(":x: Information")
            .setDescription("You must specify a valid backup ID.\ne.g. `n!info -b 1234567890`")
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
