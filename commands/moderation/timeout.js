// commands/timeout.js
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout.')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (1-40320 minutes / 28 days max).')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout.')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const targetUser = interaction.options.getUser('user');
            const duration = interaction.options.getInteger('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | User not found in this server!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (targetUser.id === interaction.user.id) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | You cannot timeout yourself!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (targetUser.id === interaction.client.user.id) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | You cannot timeout the bot!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (targetUser.id === interaction.guild.ownerId) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | You cannot timeout the server owner!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | You do not have permission to timeout members!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | I do not have permission to timeout members!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | You cannot timeout a user with equal or higher role than you!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | I cannot timeout a user with equal or higher role than me!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (targetMember.communicationDisabledUntil && targetMember.communicationDisabledUntil > Date.now()) {
                const embedError = new EmbedBuilder()
                    .setColor('Orange')
                    .setTitle('System Watcher')
                    .addFields({ name: '⚠️ | This user is already timed out!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            const timeoutDuration = duration * 60 * 1000;
            const timeoutUntil = new Date(Date.now() + timeoutDuration);

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('Orange')
                    .setTitle('You have been timed out')
                    .setDescription(`You have been timed out in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Duration', value: formatDuration(duration), inline: true },
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Timeout ends', value: `<t:${Math.floor(timeoutUntil.getTime() / 1000)}:R>`, inline: false }
                    )
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Could not send DM to ${targetUser.tag}`);
            }

            await targetMember.timeout(timeoutDuration, reason);

            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('User Timed Out')
                .setDescription(`🔇 | **${targetUser.tag}** has been timed out successfully!`)
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Duration', value: formatDuration(duration), inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Timeout ends', value: `<t:${Math.floor(timeoutUntil.getTime() / 1000)}:R>`, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ text: `Executed by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error in timeout command:", error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❎ | An error occurred while trying to timeout the user! - (507C)');

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embedError] });
            } else {
                await interaction.reply({ embeds: [embedError] });
            }
        }
    }
};

function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        let result = `${hours} hour${hours !== 1 ? 's' : ''}`;
        if (remainingMinutes > 0) {
            result += ` and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
        }
        return result;
    } else {
        const days = Math.floor(minutes / 1440);
        const remainingHours = Math.floor((minutes % 1440) / 60);
        const remainingMinutes = minutes % 60;
        
        let result = `${days} day${days !== 1 ? 's' : ''}`;
        if (remainingHours > 0) {
            result += `, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
        }
        if (remainingMinutes > 0) {
            result += `, and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
        }
        return result;
    }
}