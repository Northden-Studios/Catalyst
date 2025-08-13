// commands/security.js
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('security')
        .setDescription('Manage server security settings and information.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('audit')
                .setDescription('View recent audit log entries.')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of entries to display (1-10).')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lockdown')
                .setDescription('Lock down a channel to prevent messages.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to lockdown.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the lockdown.')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock a previously locked channel.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to unlock.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Display server security information.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('userinfo')
                .setDescription('Get security information about a user.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to get information about.')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'audit':
                    await handleAuditLog(interaction);
                    break;
                case 'lockdown':
                    await handleLockdown(interaction);
                    break;
                case 'unlock':
                    await handleUnlock(interaction);
                    break;
                case 'info':
                    await handleSecurityInfo(interaction);
                    break;
                case 'userinfo':
                    await handleUserInfo(interaction);
                    break;
                default:
                    throw new Error('Unknown subcommand');
            }

        } catch (error) {
            console.error("Error in security command:", error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❎ | An error occurred while executing the security command! - (508C)');

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embedError] });
            } else {
                await interaction.reply({ embeds: [embedError] });
            }
        }
    }
};

async function handleAuditLog(interaction) {
    // Check if user has permission to view audit log
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
        const embedError = new EmbedBuilder()
            .setColor('Red')
            .setTitle('System Watcher')
            .addFields({ name: '❎ | You do not have permission to view audit logs!', value: '\u200B', inline: false });

        return interaction.editReply({ embeds: [embedError] });
    }

    const limit = interaction.options.getInteger('limit') || 5;
    
    try {
        const auditLogs = await interaction.guild.fetchAuditLogs({ limit });
        
        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('🔍 Recent Audit Log Entries')
            .setDescription(`Showing the last ${auditLogs.entries.size} audit log entries`)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        auditLogs.entries.forEach((entry, index) => {
            const action = entry.action;
            const executor = entry.executor;
            const target = entry.target;
            const reason = entry.reason || 'No reason provided';
            
            embed.addFields({
                name: `${index + 1}. ${getActionName(action)}`,
                value: `**Executor:** ${executor?.tag || 'Unknown'}\n**Target:** ${target?.tag || target?.name || 'Unknown'}\n**Reason:** ${reason}\n**Time:** <t:${Math.floor(entry.createdTimestamp / 1000)}:R>`,
                inline: false
            });
        });

        return interaction.editReply({ embeds: [embed] });
    } catch (error) {
        const embedError = new EmbedBuilder()
            .setColor('Red')
            .setTitle('System Watcher')
            .addFields({ name: '❎ | Could not fetch audit logs!', value: '\u200B', inline: false });

        return interaction.editReply({ embeds: [embedError] });
    }
}

async function handleLockdown(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'Channel locked by security command';

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        const embedError = new EmbedBuilder()
            .setColor('Red')
            .setTitle('System Watcher')
            .addFields({ name: '❎ | You do not have permission to manage channels!', value: '\u200B', inline: false });

        return interaction.editReply({ embeds: [embedError] });
    }

    try {

        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false
        }, { reason });

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🔒 Channel Locked')
            .setDescription(`Channel ${channel} has been locked successfully!`)
            .addFields(
                { name: 'Reason', value: reason, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true }
            )
            .setFooter({ text: `Executed by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    } catch (error) {
        const embedError = new EmbedBuilder()
            .setColor('Red')
            .setTitle('System Watcher')
            .addFields({ name: '❎ | Could not lock the channel!', value: '\u200B', inline: false });

        return interaction.editReply({ embeds: [embedError] });
    }
}

async function handleUnlock(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        const embedError = new EmbedBuilder()
            .setColor('Red')
            .setTitle('System Watcher')
            .addFields({ name: '❎ | You do not have permission to manage channels!', value: '\u200B', inline: false });

        return interaction.editReply({ embeds: [embedError] });
    }

    try {

        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: null
        }, { reason: 'Channel unlocked by security command' });

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🔓 Channel Unlocked')
            .setDescription(`Channel ${channel} has been unlocked successfully!`)
            .addFields(
                { name: 'Moderator', value: interaction.user.tag, inline: true }
            )
            .setFooter({ text: `Executed by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    } catch (error) {
        const embedError = new EmbedBuilder()
            .setColor('Red')
            .setTitle('System Watcher')
            .addFields({ name: '❎ | Could not unlock the channel!', value: '\u200B', inline: false });

        return interaction.editReply({ embeds: [embedError] });
    }
}

async function handleSecurityInfo(interaction) {
    const guild = interaction.guild;
    
    const verificationLevels = {
        0: 'None',
        1: 'Low',
        2: 'Medium',
        3: 'High',
        4: 'Very High'
    };

    const explicitContentFilters = {
        0: 'Disabled',
        1: 'Members without roles',
        2: 'All members'
    };

    const mfaLevels = {
        0: 'None',
        1: 'Elevated'
    };

    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🛡️ Server Security Information')
        .setDescription(`Security overview for **${guild.name}**`)
        .addFields(
            { name: 'Verification Level', value: verificationLevels[guild.verificationLevel], inline: true },
            { name: 'Explicit Content Filter', value: explicitContentFilters[guild.explicitContentFilter], inline: true },
            { name: 'MFA Requirement', value: mfaLevels[guild.mfaLevel], inline: true },
            { name: 'Member Count', value: guild.memberCount.toString(), inline: true },
            { name: 'Role Count', value: guild.roles.cache.size.toString(), inline: true },
            { name: 'Channel Count', value: guild.channels.cache.size.toString(), inline: true },
            { name: 'Server Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
            { name: 'Server ID', value: guild.id, inline: true }
        )
        .setThumbnail(guild.iconURL())
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
}

async function handleUserInfo(interaction) {
    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
        const embedError = new EmbedBuilder()
            .setColor('Red')
            .setTitle('System Watcher')
            .addFields({ name: '❎ | User not found in this server!', value: '\u200B', inline: false });

        return interaction.editReply({ embeds: [embedError] });
    }

    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('👤 User Security Information')
        .setDescription(`Security information for **${user.tag}**`)
        .addFields(
            { name: 'User ID', value: user.id, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: 'Highest Role', value: member.roles.highest.name, inline: true },
            { name: 'Role Count', value: member.roles.cache.size.toString(), inline: true },
            { name: 'Permissions', value: member.permissions.has(PermissionsBitField.Flags.Administrator) ? 'Administrator' : 'Standard', inline: true },
            { name: 'Timeout Status', value: member.communicationDisabledUntil && member.communicationDisabledUntil > Date.now() ? '🔇 Timed Out' : '✅ Not Timed Out', inline: true },
            { name: 'Bot Account', value: user.bot ? 'Yes' : 'No', inline: true },
            { name: 'System Account', value: user.system ? 'Yes' : 'No', inline: true }
        )
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
}

function getActionName(action) {
    const actions = {
        1: 'Guild Update',
        10: 'Channel Create',
        11: 'Channel Update',
        12: 'Channel Delete',
        13: 'Channel Overwrite Create',
        14: 'Channel Overwrite Update',
        15: 'Channel Overwrite Delete',
        20: 'Member Kick',
        21: 'Member Prune',
        22: 'Member Ban Add',
        23: 'Member Ban Remove',
        24: 'Member Update',
        25: 'Member Role Update',
        26: 'Member Move',
        27: 'Member Disconnect',
        28: 'Bot Add',
        30: 'Role Create',
        31: 'Role Update',
        32: 'Role Delete',
        40: 'Invite Create',
        41: 'Invite Update',
        42: 'Invite Delete',
        50: 'Webhook Create',
        51: 'Webhook Update',
        52: 'Webhook Delete',
        60: 'Emoji Create',
        61: 'Emoji Update',
        62: 'Emoji Delete',
        72: 'Message Delete',
        73: 'Message Bulk Delete',
        74: 'Message Pin',
        75: 'Message Unpin',
        80: 'Integration Create',
        81: 'Integration Update',
        82: 'Integration Delete',
        83: 'Stage Instance Create',
        84: 'Stage Instance Update',
        85: 'Stage Instance Delete',
        90: 'Sticker Create',
        91: 'Sticker Update',
        92: 'Sticker Delete',
        100: 'Guild Scheduled Event Create',
        101: 'Guild Scheduled Event Update',
        102: 'Guild Scheduled Event Delete',
        110: 'Thread Create',
        111: 'Thread Update',
        112: 'Thread Delete',
        121: 'Application Command Permission Update',
        140: 'Auto Moderation Rule Create',
        141: 'Auto Moderation Rule Update',
        142: 'Auto Moderation Rule Delete',
        143: 'Auto Moderation Block Message',
        144: 'Auto Moderation Flag to Channel',
        145: 'Auto Moderation User Communication Disabled'
    };

    return actions[action] || `Unknown Action (${action})`;
}