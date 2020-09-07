export const createBackup = async (message, options) => {

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
                .setDescription(options.cronSchedule ? "Scheduled backup complete. Use n!list to view your backups." : "Backup successful. Use n!list to view your backups.")
                .setTimestamp()
                .setFooter(message.guild.name)
            ); //dm
        });
}