const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ActivityType, IntentsBitField, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');
const { Connectors } = require('shoukaku');
const { Kazagumo, Plugins } = require('kazagumo');
const LinkIdentifier = require('./commands/security/identifier.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildIntegrations
    ] 
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandCategories = fs.readdirSync(commandsPath).filter(file => {
    return fs.statSync(path.join(commandsPath, file)).isDirectory();
});

for (const category of commandCategories) {
    const categoryPath = path.join(commandsPath, category);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(categoryPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] Perintah di ${filePath} tidak memiliki properti "data" atau "execute" yang diperlukan.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = require('node:fs').readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`[EVENT] Loaded event: ${event.name}`);
}

client.once('ready', async (c) => {

    client.user.setActivity({
        name: 'Your Personal Bot!',
        type: ActivityType.Listening,
    });

    console.log(`Bot ${client.user.tag} sudah online!`);
});

const linkIdentifier = new LinkIdentifier();

client.on('messageCreate', async (message) => {
    
    await linkIdentifier.checkMessage(message);
    
});

// Bot Joined the Server! //
client.on('guildCreate', async guild => {
    let welcomeChannel = null;

    if (guild.systemChannel && guild.systemChannel.permissionsFor(guild.members.me).has('SendMessages')) {
        welcomeChannel = guild.systemChannel;
    }

    if (!welcomeChannel) {
        welcomeChannel = guild.channels.cache.find(channel => 
            channel.type === 0 &&
            channel.permissionsFor(guild.members.me).has('SendMessages') &&
            channel.name === 'general'
        );
    }

    if (!welcomeChannel) {
        welcomeChannel = guild.channels.cache.find(channel => 
            channel.type === 0 &&
            channel.permissionsFor(guild.members.me).has('SendMessages')
        );
    }

    if (welcomeChannel) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x00FF00) 
            .setTitle(`🎉 Hello from ${client.user.username}!`)
            .setDescription(
                `Thanks for inviting me to **${guild.name}**! I'm here to help you with various tasks.` +
                `\n\nTo get started, try typing \`/setup\` to see a list of my commands.` +
                `\nIf you need support or want to suggest features, use \`/support\`.` +
                `\n\nI recommend setting up a dedicated bot commands channel for a cleaner experience!`
            )
            .addFields(
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Member Count', value: guild.memberCount.toString(), inline: true },
                { name: 'Distributed by', value: 'Northden Studios', inline: true },
                { name: 'Node.js Version', value: 'v21.5.20', inline: true },
                { name: 'Build Version', value: 'v 1.0.4', inline: true }
            )
            .setFooter({ text: 'Powered by Northden Studios' })
            .setTimestamp();

        try {
            await welcomeChannel.send({ embeds: [welcomeEmbed] });
            console.log(`Sent welcome message to ${welcomeChannel.name} in ${guild.name}`);
        } catch (error) {
            console.error(`Could not send welcome message to ${guild.name} (Channel: ${welcomeChannel?.name || 'N/A'}):`, error);
        }
    } else {
        console.warn(`Could not find a suitable channel to send welcome message in ${guild.name}`);
    }
})

const Nodes = [{
    name: '[YOUR NAME SERVER]',
    url: '[YOUR URL SERVER LINK]',
    auth: '[YOUR AUTHOR SERVER]', 
    secure: false 
}];

client.manager = new Kazagumo({
    defaultSearchEngine: 'youtube',
    plugins: [
        new Plugins.PlayerMoved(client), 
    ],
    send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
    }
}, new Connectors.DiscordJS(client), Nodes);

client.manager.on('playerCreate', (player) => {
    console.log(`[Kazagumo] Player created for guild: ${player.guildId}`);
});

client.manager.on('playerDestroy', (player) => {
    console.log(`[Kazagumo] Player destroyed for guild: ${player.guildId}`);
});

client.manager.on('nodeConnect', (node) => {
    console.log(`[Kazagumo] Node '${node.options.name}' connected!`);
});

client.manager.on('nodeDisconnect', (node) => {
    console.warn(`[Kazagumo] Node '${node.options.name}' disconnected!`);
});

client.manager.on('nodeError', (node, error) => {
    console.error(`[Kazagumo] Node '${node.options.name}' encountered an error:`, error);
});

client.manager.on('trackStart', (player, track) => {
    console.log(`[Kazagumo] Started playing '${track.title}' in guild: ${player.guildId}`);
});

client.manager.on('queueEnd', (player) => {
    console.log(`[Kazagumo] Queue ended in guild: ${player.guildId}`);
});


client.login(token);
