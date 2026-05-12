require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");

const ms = require("ms");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

/* =========================
   CONFIG
========================= */

const PREFIX = "!";

const LOG_CHANNEL = "logs";
const STARBOARD_CHANNEL = "starboard";
const SUGGESTION_CHANNEL = "suggestions";
const WELCOME_CHANNEL = "welcome";
const VERIFY_CHANNEL = "verify";

const BAD_WORDS = [
  "badword1",
  "badword2"
];

const afkUsers = new Map();
const levels = new Map();
const reminders = [];

/* =========================
   READY
========================= */

client.once("ready", () => {
  console.log(`${client.user.tag} online`);
});

/* =========================
   WELCOME SYSTEM
========================= */

client.on("guildMemberAdd", async member => {
  const channel = member.guild.channels.cache.find(
    c => c.name === WELCOME_CHANNEL
  );

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("Welcome!")
    .setDescription(`Welcome ${member}`)
    .setColor("Green");

  channel.send({ embeds: [embed] });
});

/* =========================
   LOGGING
========================= */

client.on("guildMemberAdd", member => {
  const log = member.guild.channels.cache.find(
    c => c.name === LOG_CHANNEL
  );

  if (!log) return;

  log.send(`✅ ${member.user.tag} joined`);
});

client.on("guildMemberRemove", member => {
  const log = member.guild.channels.cache.find(
    c => c.name === LOG_CHANNEL
  );

  if (!log) return;

  log.send(`❌ ${member.user.tag} left`);
});

client.on("messageDelete", message => {
  if (!message.guild) return;

  const log = message.guild.channels.cache.find(
    c => c.name === LOG_CHANNEL
  );

  if (!log) return;

  log.send(`🗑️ Message deleted: ${message.content}`);
});

/* =========================
   AUTOMOD
========================= */

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (
    BAD_WORDS.some(word =>
      message.content.toLowerCase().includes(word)
    )
  ) {
    await message.delete();

    message.channel.send(
      `${message.author}, watch your language.`
    );
  }
});

/* =========================
   LEVEL SYSTEM
========================= */

client.on("messageCreate", message => {
  if (message.author.bot) return;

  const id = message.author.id;

  if (!levels.has(id)) {
    levels.set(id, {
      xp: 0,
      level: 1
    });
  }

  const data = levels.get(id);

  data.xp += 10;

  if (data.xp >= data.level * 100) {
    data.level++;
    data.xp = 0;

    message.channel.send(
      `🎉 ${message.author} leveled up to ${data.level}`
    );
  }
});

/* =========================
   AFK SYSTEM
========================= */

client.on("messageCreate", message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${PREFIX}afk`)) {
    const reason =
      message.content.split(" ").slice(1).join(" ") ||
      "AFK";

    afkUsers.set(message.author.id, reason);

    message.reply(`You are now AFK: ${reason}`);
  }

  if (afkUsers.has(message.author.id)) {
    afkUsers.delete(message.author.id);

    message.reply("Welcome back, AFK removed.");
  }

  message.mentions.users.forEach(user => {
    if (afkUsers.has(user.id)) {
      message.reply(
        `${user.tag} is AFK: ${afkUsers.get(user.id)}`
      );
    }
  });
});

/* =========================
   STARBOARD
========================= */

client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.emoji.name !== "⭐") return;

  if (reaction.count < 3) return;

  const starboard =
    reaction.message.guild.channels.cache.find(
      c => c.name === STARBOARD_CHANNEL
    );

  if (!starboard) return;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: reaction.message.author.tag
    })
    .setDescription(reaction.message.content)
    .setColor("Yellow");

  starboard.send({ embeds: [embed] });
});

/* =========================
   SUGGESTION SYSTEM
========================= */

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (
    message.channel.name === SUGGESTION_CHANNEL
  ) {
    await message.react("👍");
    await message.react("👎");
  }
});

/* =========================
   REMINDER SYSTEM
========================= */

client.on("messageCreate", message => {
  if (message.author.bot) return;

  if (
    message.content.startsWith(`${PREFIX}remind`)
  ) {
    const args = message.content.split(" ");

    const time = args[1];
    const reminder = args.slice(2).join(" ");

    if (!time || !reminder) {
      return message.reply(
        "Usage: !remind 10m hello"
      );
    }

    message.reply(
      `Reminder set for ${time}`
    );

    setTimeout(() => {
      message.author.send(
        `⏰ Reminder: ${reminder}`
      );
    }, ms(time));
  }
});

/* =========================
   TICKET SYSTEM
========================= */

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (message.content === `${PREFIX}ticket`) {
    const existing =
      message.guild.channels.cache.find(
        c => c.name === `ticket-${message.author.username}`
      );

    if (existing) {
      return message.reply(
        "You already have a ticket."
      );
    }

    const channel =
      await message.guild.channels.create({
        name: `ticket-${message.author.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: ["ViewChannel"]
          },
          {
            id: message.author.id,
            allow: ["ViewChannel"]
          }
        ]
      });

    const closeButton =
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Close Ticket")
          .setStyle(ButtonStyle.Danger)
      );

    channel.send({
      content: `${message.author}`,
      components: [closeButton]
    });
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "close_ticket") {
    await interaction.channel.delete();
  }
});

/* =========================
   VERIFICATION SYSTEM
========================= */

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (
    message.content === `${PREFIX}verifysetup`
  ) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return;

    const button =
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("verify")
          .setLabel("Verify")
          .setStyle(ButtonStyle.Success)
      );

    const embed = new EmbedBuilder()
      .setTitle("Verification")
      .setDescription(
        "Click below to verify."
      )
      .setColor("Blue");

    message.channel.send({
      embeds: [embed],
      components: [button]
    });
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "verify") {
    const role =
      interaction.guild.roles.cache.find(
        r => r.name === "Verified"
      );

    if (!role)
      return interaction.reply({
        content:
          "Create a role called Verified",
        ephemeral: true
      });

    await interaction.member.roles.add(role);

    interaction.reply({
      content: "You are verified!",
      ephemeral: true
    });
  }
});

/* =========================
   MODERATION
========================= */

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];

  if (cmd === `${PREFIX}kick`) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.KickMembers
      )
    )
      return;

    const user = message.mentions.members.first();

    if (!user) return;

    user.kick();

    message.channel.send(
      `${user.user.tag} kicked`
    );
  }

  if (cmd === `${PREFIX}ban`) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.BanMembers
      )
    )
      return;

    const user = message.mentions.members.first();

    if (!user) return;

    user.ban();

    message.channel.send(
      `${user.user.tag} banned`
    );
  }

  if (cmd === `${PREFIX}purge`) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    )
      return;

    const amount = parseInt(args[1]);

    if (!amount) return;

    message.channel.bulkDelete(amount);

    message.channel.send(
      `Deleted ${amount} messages`
    );
  }
});

/* =========================
   EMBED COMMAND
========================= */

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (
    message.content.startsWith(`${PREFIX}embed`)
  ) {
    const text =
      message.content.split(" ").slice(1).join(" ");

    const embed = new EmbedBuilder()
      .setTitle("Custom Embed")
      .setDescription(text)
      .setColor("Red");

    message.channel.send({
      embeds: [embed]
    });
  }
});

/* =========================
   REACTION ROLES
========================= */

client.on("messageCreate", async message => {
  if (
    message.content === `${PREFIX}rrsetup`
  ) {
    const role =
      message.guild.roles.cache.find(
        r => r.name === "Member"
      );

    if (!role) {
      return message.reply(
        "Create a role named Member"
      );
    }

    const msg = await message.channel.send(
      "React with ✅ to get Member role."
    );

    await msg.react("✅");
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  if (reaction.emoji.name === "✅") {
    const role =
      reaction.message.guild.roles.cache.find(
        r => r.name === "Member"
      );

    if (!role) return;

    const member =
      reaction.message.guild.members.cache.get(
        user.id
      );

    member.roles.add(role);
  }
});

/* =========================
   BASIC COMMANDS
========================= */

client.on("messageCreate", message => {
  if (message.author.bot) return;

  if (message.content === `${PREFIX}ping`) {
    message.reply("Pong!");
  }

  if (message.content === `${PREFIX}server`) {
    message.reply(
      `Server name: ${message.guild.name}`
    );
  }

  if (message.content === `${PREFIX}userinfo`) {
    message.reply(
      `Username: ${message.author.tag}`
    );
  }
});

client.login(process.env.TOKEN);
