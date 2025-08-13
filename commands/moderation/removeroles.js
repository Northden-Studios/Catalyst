const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeroles')
        .setDescription('Remove roles from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove roles from')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('roles')
                .setDescription('Role IDs or names separated by commas (e.g., "Role1, Role2, 123456789")')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for removing the roles')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const targetUser = interaction.options.getUser('user');
            const rolesInput = interaction.options.getString('roles');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ User Not Found')
                            .setDescription('The specified user is not a member of this server!')
                            .setColor('#FF0000')
                    ]
                });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ Permission Denied')
                            .setDescription('You need the `Manage Roles` permission to use this command!')
                            .setColor('#FF0000')
                    ]
                });
            }

            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ Bot Permission Denied')
                            .setDescription('I need the `Manage Roles` permission to remove roles!')
                            .setColor('#FF0000')
                    ]
                });
            }

            const roleNames = rolesInput.split(',').map(role => role.trim());
            const rolesToRemove = [];
            const notFoundRoles = [];
            const cannotRemoveRoles = [];

            for (const roleName of roleNames) {
                let role = null;
                
                if (/^\d+$/.test(roleName)) {
                    role = interaction.guild.roles.cache.get(roleName);
                }
                
                if (!role) {
                    role = interaction.guild.roles.cache.find(r => 
                        r.name.toLowerCase() === roleName.toLowerCase()
                    );
                }

                if (!role) {
                    notFoundRoles.push(roleName);
                    continue;
                }

                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    cannotRemoveRoles.push(role.name);
                    continue;
                }

                if (role.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
                    cannotRemoveRoles.push(`${role.name} (higher than your highest role)`);
                    continue;
                }

                if (targetMember.roles.cache.has(role.id)) {
                    rolesToRemove.push(role);
                }
            }

            if (rolesToRemove.length === 0) {
                let errorMessage = 'No roles could be removed.';
                
                if (notFoundRoles.length > 0) {
                    errorMessage += `\n\n**Roles not found:** ${notFoundRoles.join(', ')}`;
                }
                
                if (cannotRemoveRoles.length > 0) {
                    errorMessage += `\n\n**Cannot remove:** ${cannotRemoveRoles.join(', ')}`;
                }

                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ No Roles Removed')
                            .setDescription(errorMessage)
                            .setColor('#FF0000')
                    ]
                });
            }

            const removedRoles = [];
            const failedRoles = [];

            for (const role of rolesToRemove) {
                try {
                    await targetMember.roles.remove(role, `Removed by ${interaction.user.tag}: ${reason}`);
                    removedRoles.push(role);
                } catch (error) {
                    console.error(`Failed to remove role ${role.name}:`, error);
                    failedRoles.push(role.name);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ Roles Removed Successfully')
                .setDescription(`Roles have been removed from ${targetMember.user.tag}`)
                .setColor('#00FF00')
                .addFields(
                    {
                        name: '👤 Target User',
                        value: `${targetMember.user.tag} (${targetMember.id})`,
                        inline: true
                    },
                    {
                        name: '👮 Removed By',
                        value: `${interaction.user.tag}`,
                        inline: true
                    },
                    {
                        name: '📝 Reason',
                        value: reason,
                        inline: false
                    }
                )
                .setThumbnail(targetMember.user.displayAvatarURL())
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            if (removedRoles.length > 0) {
                embed.addFields({
                    name: '✅ Removed Roles',
                    value: removedRoles.map(role => `<@&${role.id}>`).join(', '),
                    inline: false
                });
            }

            if (failedRoles.length > 0) {
                embed.addFields({
                    name: '⚠️ Failed to Remove',
                    value: failedRoles.join(', '),
                    inline: false
                });
            }

            if (notFoundRoles.length > 0) {
                embed.addFields({
                    name: '❌ Roles Not Found',
                    value: notFoundRoles.join(', '),
                    inline: false
                });
            }

            if (cannotRemoveRoles.length > 0) {
                embed.addFields({
                    name: '🚫 Cannot Remove',
                    value: cannotRemoveRoles.join(', '),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

            console.log(`[ROLE REMOVAL] ${interaction.user.tag} removed ${removedRoles.length} role(s) from ${targetMember.user.tag} in ${interaction.guild.name}`);

        } catch (error) {
            console.error('Error in removeroles command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('An error occurred while removing roles. Please try again.')
                .setColor('#FF0000')
                .setTimestamp();

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed] });
            }
        }
    }
};