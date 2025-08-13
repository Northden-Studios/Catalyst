const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('To View Average Ping Server from API Server'),
    async execute(interaction) {
        const infoEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('📈 Ping Average - Catalyst')
            .setDescription('Real-Time Ping Average update per hour')
            .addFields(
                { name: '📊 Ping', value:`${interaction.client.ws.ping}ms`, inline: true},
                { name: '🖥️ Server Region', value: 'United States - Ohio', inline: true},
                { name: '🛡️ Encrypted', value: 'true', inline: true},
            )
            .setTimestamp()
            .setFooter({ text: 'Powered by Northden Studios', iconURL: interaction.client.user.displayAvatarURL() });
        await interaction.reply({ embeds: [infoEmbed] });
    },
};