export const listBackups = async (message) => {
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