const tmi = require('tmi.js');

const {
	NODE_ENV,
	TMI_NAME: username,
	TMI_PASS: password,
	TMI_CHANNEL: joinChannels,
	MOD_ACTION,
	BAN_REASON: banReason = 'Anti-art moderation bot',
	TIMEOUT_SECONDS: timeoutSeconds
} = process.env;

let envIsGood = false;

if(!username || !password) {
	console.log('Missing TMI_NAME or TMI_PASS in environment (bot username/password)');
}
else if(!joinChannels) {
	console.log('Missing TMI_CHANNEL in environment (csv list of channels)');
}
else {
	envIsGood = true;
}

if(!envIsGood) {
	process.exit();
}

const brailleRange = '\\u2800-\\u28FF';
const _regexText = `[${brailleRange}]`;
const _regexFlags = '';
const regex = new RegExp(_regexText, _regexFlags);

console.log({ regex });

const modAction = {
	ban,
	b: ban,

	timeout,
	to: timeout,
	t: timeout,

	deletemessage,
	delete: deletemessage,
	d: deletemessage
}[MOD_ACTION.toLowerCase()] || deletemessage;

/** @type {tmi.Client} */
const client = new tmi.Client({
	options: { debug: NODE_ENV === 'development' },
	identity: { username, password },
	connection: { secure: true, reconnect: true },
	channels: joinChannels.split(',')
});

client.connect().catch(err => console.error(err));

client.on('message', (channel, tags, message, self) => {
	if(self) {
		return;
	}
	const badges = tags.badges || {};
	if(badges.moderator || badges.broadcaster) {
		return;
	}
	const hasBadText = regex.test(message);
	if(hasBadText) {
		modAction(channel, tags);
	}
});

function logModAction(action, channel, username) {
	console.log(`\u001b[31m${action} bad message\u001b[0m`);
}

function ban(channel, { username }) {
	logModAction('Banning', channel, username);
	client.ban(channel, username, banReason);
}

function timeout(channel, { username }) {
	logModAction('Timing out', channel, username);
	client.timeout(channel, username, timeoutSeconds, banReason);
}

function deletemessage(channel, { id, username }) {
	logModAction('Deleting', channel, username);
	client.deletemessage(channel, id);
}