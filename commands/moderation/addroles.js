const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addroles')
        .setDescription('Add one or more roles to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to add roles to')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role1')
                .setDescription('First role to add')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role2')
                .setDescription('Second role to add')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role3')
                .setDescription('Third role to add')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role4')
                .setDescription('Fourth role to add')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role5')
                .setDescription('Fifth role to add')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for adding the roles')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),
    
    async execute(interaction) {
        const { guild, member: executor, options } = interaction;
        const targetUser = options.getUser('user');
        const reason = options.getString('reason') || `Role(s) added by ${executor.displayName}`;
        
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ User not found in this server!')
                ],
                ephemeral: true
            });
        }

        const rolesToAdd = [];
        for (let i = 1; i <= 5; i++) {
            const role = options.getRole(`role${i}`);
            if (role) {
                rolesToAdd.push(role);
            }
        }

        if (!executor.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ You don\'t have permission to manage roles!')
                ],
                ephemeral: true
            });
        }

        if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ I don\'t have permission to manage roles!')
                ],
                ephemeral: true
            });
        }
        
        const invalidRoles = [];
        const validRoles = [];
        const alreadyHasRoles = [];
        
        for (const role of rolesToAdd) {

            if (role.id === guild.id) {
                invalidRoles.push(`${role.name} (cannot assign @everyone)`);
                continue;
            }
            
            if (role.managed) {
                invalidRoles.push(`${role.name} (managed by integration)`);
                continue;
            }
            
            if (executor.roles.highest.position <= role.position && guild.ownerId !== executor.id) {
                invalidRoles.push(`${role.name} (higher than your highest role)`);
                continue;
            }
            
            if (guild.members.me.roles.highest.position <= role.position) {
                invalidRoles.push(`${role.name} (higher than my highest role)`);
                continue;
            }
            
            if (targetMember.roles.cache.has(role.id)) {
                alreadyHasRoles.push(role.name);
                continue;
            }
            
            validRoles.push(role);
        }
        
        if (validRoles.length === 0) {
            let errorMessage = '❌ No roles could be added!';
            
            if (invalidRoles.length > 0) {
                errorMessage += `\n\n**Invalid roles:**\n${invalidRoles.map(r => `• ${r}`).join('\n')}`;
            }
            
            if (alreadyHasRoles.length > 0) {
                errorMessage += `\n\n**User already has:**\n${alreadyHasRoles.map(r => `• ${r}`).join('\n')}`;
            }
            
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription(errorMessage)
                ],
                ephemeral: true
            });
        }
        
        try {
            await targetMember.roles.add(validRoles, reason);

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Roles Added Successfully')
                .setDescription(`Added **${validRoles.length}** role(s) to ${targetUser}`)
                .addFields(
                    {
                        name: '👤 User',
                        value: `${targetUser} (${targetUser.tag})`,
                        inline: true
                    },
                    {
                        name: '🎭 Roles Added',
                        value: validRoles.map(r => `• ${r}`).join('\n'),
                        inline: true
                    },
                    {
                        name: '👮 Moderator',
                        value: executor.toString(),
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: `User ID: ${targetUser.id}` });
            
            if (reason !== `Role(s) added by ${executor.displayName}`) {
                successEmbed.addFields({
                    name: '📝 Reason',
                    value: reason,
                    inline: false
                });
            }
            
            let warningText = '';
            if (invalidRoles.length > 0) {
                warningText += `**⚠️ Could not add:**\n${invalidRoles.map(r => `• ${r}`).join('\n')}`;
            }
            if (alreadyHasRoles.length > 0) {
                if (warningText) warningText += '\n\n';
                warningText += `**ℹ️ Already had:**\n${alreadyHasRoles.map(r => `• ${r}`).join('\n')}`;
            }
            
            if (warningText) {
                successEmbed.addFields({
                    name: '⚠️ Warnings',
                    value: warningText,
                    inline: false
                });
            }
            
            await interaction.reply({
                embeds: [successEmbed]
            });
            
        } catch (error) {
            console.error('Error adding roles:', error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ An error occurred while adding the roles!')
                ],
                ephemeral: true
            });
        }
    },
};