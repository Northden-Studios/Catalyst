const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About the bot and development team'),
    async execute(interaction) {
        const botInfoEmbed = new EmbedBuilder()
            .setColor('Random') 
            .setTitle('About the development')
            .setDescription('Support our development by donate or contributed with open source projects!')
            .addFields(
                { name: '👷🏻‍♂️ Creator', value: 'HiddenDev#1732', inline: true },
                { name: '🔎 Created Bot', value: '28 Nov 2021', inline: true },
                { name: '🔗 Dev Page', value: 'https://github.com/Northden-Studios/Catalyst', inline: true},
                { name: '🧑🏻‍💻 Programmed at', value: 'Node.js Framework', inline: true},
                { name: '🛠️ Build Version', value: 'v 1.1.3', inline: true},
                { name: '📤 Distributed by', value: 'Northden Studios', inline: true}
            )
            .setTimestamp()
            .setFooter({ text: 'Powered by Northden Studios', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [botInfoEmbed] });
    },
};