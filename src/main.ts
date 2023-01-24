import { UNLOCK_THOUGHT_CONTROL } from './constants/command';
import { Markup, Telegraf } from 'telegraf';
import { env } from './utils/env';
import { create, send, sendMessageToChatGPT } from './conversation';
import { editMessage } from './bot';
import { UNLOCK_THOUGHT_CONTROL_MESSAGE } from './constants/message';
import { User } from './models/users';
import { connectToDB } from './utils/db';

const FREE_INITIAL_MESSAGES = 10;
const BONUS_MESSAGES_FOR_INVITATIONS = 10;
const INVITATION_LINK_PREFIX = 'https://t.me/ChatGPTReferalBot?start=';

// Initialize DB connection
connectToDB();

// Create a new telegraf bot instance
const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN, {
  handlerTimeout: 3 * 60 * 1000,
});

// When a user starts a conversation with the bot
bot.start(async (ctx) => {
  const userDetails = ctx.from;
  console.log('start', userDetails);

  console.log(ctx);

  const invitedByUsername = ctx.startPayload;

  const userWhoInvited = await User.findOne({ userName: invitedByUsername });
  // Adding bonus tokens to the one who invited
  if (userWhoInvited) {
    console.log(
      `Checking if user already exists in DB: ${userDetails.username}`,
    );
    const invitedUser = await User.findOne({ userName: userDetails.username });
    if (invitedUser) {
      console.log(
        `Looks like user already exists in DB: ${userDetails.username}`,
      );
      return ctx.reply(
        'Looks like you have already started conversation with this bot',
      );
    } else {
      console.log(`Adding bonus points to: ${invitedByUsername}`);
      userWhoInvited.messagesLeft += BONUS_MESSAGES_FOR_INVITATIONS;
      await userWhoInvited.save();
      console.log(`Added bonus points to: ${invitedByUsername}`);

      console.log(`Creating a new user in DB: ${userDetails.username}`);
      // Creating a new user in DB
      await new User({
        // Telegram details
        id: userDetails.id,
        isBot: userDetails.is_bot,
        firstName: userDetails.first_name,
        userName: userDetails.username,
        language: userDetails.language_code,
        isPremuim: userDetails.is_premium,

        // Usage and referal details
        messagesSent: 0,
        messagesLeft: FREE_INITIAL_MESSAGES,
        invitedBy: invitedByUsername,
      }).save();
      console.log(`Saved a new user in DB: ${userDetails.username}`);
    }
  } else {
    return ctx.reply('Sorry, looks like your invitaion link is invalid');
  }

  // Create a keyboard
  // const keyboard = Markup.keyboard([
  //   [Markup.button.callback(UNLOCK_THOUGHT_CONTROL, UNLOCK_THOUGHT_CONTROL)],
  // ]);

  // try {
  //   // Create a conversation for the user
  //   await create(ctx.from.id);
  // } catch (e) {
  //   console.error(e);
  //   return ctx.reply('❌ Please check ChatGPT token.');
  // }

  // Reply to the user with a greeting and the keyboard
  // return ctx.reply(`Hello ${ctx.from?.first_name}! Let's chat`, keyboard);
  return ctx.reply(
    `Hello ${ctx.from?.first_name}! Let's chat. You can chat in any language you want. Please note, I am a beta version so I don't remember your previous messages.\n\nMessages left: ${FREE_INITIAL_MESSAGES}`,
  );
});

// When the bot receives a text message
bot.on('text', async (ctx) => {
  // Get the text of the message and the user's ID
  const text = ctx.message?.text.trim();
  const id = ctx.from?.id;

  // Create a keyboard that removes the previous keyboard
  const removeKeyboard = Markup.removeKeyboard();

  const userFromDB = await User.findOne({ userName: ctx.from.username });
  const userReferalLink = INVITATION_LINK_PREFIX + ctx.from.username;

  switch (text) {
    case UNLOCK_THOUGHT_CONTROL:
      // Reply with the UNLOCK_THOUGHT_CONTROL_MESSAGE and remove the keyboard
      await ctx.reply(UNLOCK_THOUGHT_CONTROL_MESSAGE, removeKeyboard);
      break;

    default:
      // If the message is not any command, send it to chatGPT

      // Send a typing indicator to the user

      try {
        // TODO: check if user has enough messages left
        if (!userFromDB || userFromDB.messagesLeft <= 0) {
          await ctx.sendMessage(
            `Unfortunately, you don't have any free messages left. To get more free messages you can invite your friends to this chat bot. For each invited user you will get ${BONUS_MESSAGES_FOR_INVITATIONS} new free messages. Your special link for invitations: ` +
              userReferalLink,
          );
          return;
        }

        await ctx.sendChatAction('typing');
        const typingMessage = await ctx.sendMessage('typing..');
        // Send the message to chatGPT
        // const response = await send(id, text, (contents) =>
        //   editMessage(
        //     ctx,
        //     message.chat.id,
        //     message.message_id,
        //     contents || 'typing...',
        //   ),
        // );

        const responseFromChatGPT = await sendMessageToChatGPT(text);

        userFromDB.messagesSent++;
        userFromDB.messagesLeft--;
        await userFromDB.save();

        const statsText = `\n\nMessages sent: ${userFromDB.messagesSent} | Messages left: ${userFromDB.messagesLeft}`;

        await ctx.sendMessage(responseFromChatGPT + statsText || '');

        await ctx.telegram.deleteMessage(
          typingMessage.chat.id,
          typingMessage.message_id,
        );

        // delete the message and send a new one to notice the user
        // await Promise.all([
        //   ctx.telegram.deleteMessage(message.chat.id, message.message_id),
        //   ctx.reply(response, removeKeyboard),
        // ]);
      } catch (e: any) {
        await ctx.sendMessage(
          '❌ Something went wrong. Details: ' + e.message,
          removeKeyboard,
        );
      }
  }
});

bot.catch(console.error);
// Start the bot
bot.launch().then(console.log).catch(console.error);

console.log('Bot started');
