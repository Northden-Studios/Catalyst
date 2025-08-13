const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove timeout from a user')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to remove timeout from')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for removing timeout')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member) {
                return await interaction.reply({
                    content: '❌ User not found in this server.',
                    ephemeral: true
                });
            }
            
            if (!member.communicationDisabledUntil) {
                return await interaction.reply({
                    content: '❌ This user is not currently timed out.',
                    ephemeral: true
                });
            }
            
            if (member.roles.highest.position >= interaction.member.roles.highest.position && 
                interaction.guild.ownerId !== interaction.user.id) {
                return await interaction.reply({
                    content: '❌ You cannot remove timeout from this user due to role hierarchy.',
                    ephemeral: true
                });
            }
            
            await member.timeout(null, reason);

            const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🔈 User Unmuted')
                    .setDescription(`✅ Successfully removed timeout from ${user.tag}.\n**Reason:** ${reason}`)
                    .setFooter({ text: `Executed by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                        
            await interaction.reply({ embeds: [embed] });
            
            await interaction.reply({
                content: `✅ Successfully removed timeout from ${user.tag}.\n**Reason:** ${reason}`,
                ephemeral: false
            });
            
        } catch (error) {
            console.error('Error removing timeout:', error);
            
            if (error.code === 50013) {
                await interaction.reply({
                    content: '❌ I don\'t have permission to remove timeout from this user.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ An error occurred while trying to remove the timeout.',
                    ephemeral: true
                });
            }
        }
    },
};