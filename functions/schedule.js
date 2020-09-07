export const clearSchedule = async (message) => {
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

export const scheduleBackup = async (message, options) => {
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
                /*
                    write this backup schedule to a scheduled-backups.json file.
                */
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
                // log because im insane.
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
                ); // if the author of the command does not confirm the scheduled backup
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
};