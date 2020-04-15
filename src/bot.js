const Discord = require('discord.js');
const fs = require('fs');
const webhookListener = require('./webhook_listener.js');
const { prefix, token } = require('./config.json');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

client.login(token);

client.on('message', message => {
	const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
	// currently redirects all dms
	/* if(message.content === `${prefix}anon help`) {
		message.channel.send('Anonbot is dead');
	}
    else */
	if(message.content === `${prefix}ko-fi`) {
		message.channel.send('Get that money sis');
	}
	else if(message.content === `${prefix}ko-fi help`) {
		message.channel.send('Para escolher os roles é necessário o role Ko-fi.');
	}
	else if(message.content === `${prefix}ko-fi config`) {
		message.channel.send({ embed: {
			color: 3447003,
			author: {
				name: client.user.username,
				icon_url: client.user.avatarURL,
			},
			description: 'Esreva o que deseja configurar:',
			fields: [{
				name: 'Emoji Reactions',
				value: 'Mude os emojis que aparecem para dar role.',
			},
			{
				name: 'Mensagem de Agradecimento',
				value: 'Edite ou desative as mensagens de agradecimento.',
			},
			],
		},
		});
		const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 30000 });
		let choosen = false;
		collector.on('collect', message => {
			const { content } = message;
			if (!choosen && content == 'Emoji Reactions') {
				message.channel.send('😔 Escolhe os novos emojis, separados por um espaço');
				choosen = true;
			}
			else if (!choosen && content == 'Change') {
				message.channel.send('You Want To Change Your Spec OK!');
				choosen = true;
			}
			else if (choosen && content.split(':').length - 1 == 4 && content.includes(',')) {
				const newEmojis = content.split(',').map(e => e.replace(/[^\w\s]/gi, '').replace(/\D/g, ''));
				const newJSON = config.roles;
				newEmojis.map ((e, i) =>newJSON[e] = config.roles[Object.keys(config.roles)[i]]);
				Object.keys(newJSON).map((e, i) => {
					if (i <= 1) delete newJSON[`${e}`];
				});
				config.roles = newJSON;
				fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
			}
		});
	}
	else if(message.content === `${prefix}commands`) {
		message.channel.send('Para escolher os roles é necessário o role Ko-fi.');
	}
	else if (message.content === `${prefix}ko-fi roles enable`) {
		message.channel.send('Get your roles sis').then(sentMessage => {
			Object.keys(config.roles).map (emoji => sentMessage.react(emoji));
			config.kofi_message_id = sentMessage.id;
			fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
			requireUncached('./config.json');
			client.destroy();
			client.login(token);

		});

	}
	/* else if (message.guild === null && !message.author.bot) {
		client.channels.cache.get(help_channel_id).send(message.content);
	}*/
});

client.on('messageReactionAdd', async (reaction, user) => {
	const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
	const { kofi_message_id, roles, donator_role } = config;
	if(!user) return;
	if(user.bot)return;
	if(!reaction.message.channel.guild) return;

	const { message, emoji } = reaction;

	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		}
		catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	const guild = user ? client.guilds.cache.find(guild => guild.members.cache.has(user.id)) : null;
	const guildMember = guild ? guild.members.cache.get(user.id) : null;

	if(message.id === kofi_message_id && guildMember.roles.cache.find(r => r.name === donator_role)) {
		if(emoji.id === Object.keys(roles)[0]) {
			guildMember.roles.add(roles[Object.keys(roles)[0]]);
			if (guildMember.roles.cache.find(r => r.id === roles[Object.keys(roles)[1]])) {
				reaction.message.reactions.resolve(Object.keys(roles)[1]).users.remove(user.id);
			}
		}
		else if(emoji.id === Object.keys(roles)[1]) {
			guildMember.roles.add(roles[Object.keys(roles)[1]]);
			if (guildMember.roles.cache.find(r => r.id === roles[Object.keys(roles)[0]])) {
				reaction.message.reactions.resolve(Object.keys(roles)[0]).users.remove(user.id);
			}
		}
		return;
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
	const { kofi_message_id, roles, donator_role } = config;
	if(!user) return;
	if(user.bot)return;
	if(!reaction.message.channel.guild) return;

	const { message, emoji } = reaction;

	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		}
		catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	const guild = user ? client.guilds.cache.find(guild => guild.members.cache.has(user.id)) : null;
	const guildMember = guild ? guild.members.cache.get(user.id) : null;

	if(message.id === kofi_message_id && guildMember.roles.cache.find(r => r.name === donator_role)) {
		if(emoji.id === Object.keys(roles)[0]) {
			guildMember.roles.remove(roles[Object.keys(roles)[0]]);
		}
		else if(emoji.id === Object.keys(roles)[1]) {
			guildMember.roles.remove(roles[Object.keys(roles)[1]]);
		}
		return;
	}
});

async function onDonation(
	paymentSource,
	paymentId,
	timestamp,
	amount,
	message,
	senderName,
) {
	try {
		const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
		const { donator_role, donation_thanks_message } = config;
		const user = client.users.cache.find(
			user => senderName.toLowerCase().indexOf(`${user.username.toLowerCase()}#${user.discriminator}`) !== -1,
		);
		const guild = user ? client.guilds.cache.find(guild => guild.members.cache.has(user.id)) : null;
		const guildMember = guild ? guild.members.cache.get(user.id) : null;

		const role = Array.from(guild.roles.cache.values())
			.find(role => role.name === donator_role);
		guildMember.roles.add(role.id);
		return await guildMember.send(donation_thanks_message);
	}
	catch (err) {
		console.warn('Error handling donation event.');
		console.warn(err);
	}
}

function requireUncached(module) {
	delete require.cache[require.resolve(module)];
	return require(module);
}

webhookListener.on('donation', onDonation);