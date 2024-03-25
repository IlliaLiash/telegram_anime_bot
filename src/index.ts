import { getRandomAnimeRequest, getAnimeById } from "./api";
import { getAnimeByChatId, addAnime } from "./db";
import bot from "./bot";

const keyboardCnstr = (inline_keyboard: any) => {
  return {
    reply_markup: {
      inline_keyboard,
    },
  };
};

const COMMANDS = [
  { command: "/start", description: "Start the bot" },
  { command: "/random", description: "Get random anime" },
  { command: "/list", description: "View your anime list" },
];

bot.setMyCommands(COMMANDS);

const showRandomAnime = async (chatId: number) => {
  const animeData = await getRandomAnime(chatId);
  const { id, attributes } = animeData.data;

  await bot.sendPhoto(chatId, attributes.posterImage.large);
  await bot.sendMessage(
    chatId,
    `Title: ${attributes.canonicalTitle}
    \nSynopsis: ${attributes.synopsis}`,
    keyboardCnstr([
      [{ text: "Next!", callback_data: "next" }],
      [
        {
          text: "Add to my list!",
          callback_data: `${id}, ${attributes.canonicalTitle}`,
        },
      ],
    ])
  );
};

const getRandomAnime = async (
  chatId: number,
  failedReqCount = 0
): Promise<any> => {
  try {
    const animeData = await getRandomAnimeRequest();

    failedReqCount = 0;

    return animeData;
  } catch (error: any) {
    if (error.response.status == 404 && failedReqCount < 5) {
      return await getRandomAnime(chatId, failedReqCount + 1);
    }

    throw error;
  }
};

const showPaginatedList = async (chatId: number, newlastEvaluatedKey: any) => {
  try {
    const animeData = await getAnimeByChatId(
      chatId.toString(),
      newlastEvaluatedKey
    );

    console.log(animeData);

    const { items, lastEvaluatedKey, isNextPageAvailable } = animeData;

    if (!items?.length) {
      return bot.sendMessage(chatId, "You have no items to show yet");
    }

    const promiseArray: any = [];

    items!.map(async (it) => {
      promiseArray.push(
        bot.sendMessage(
          chatId,
          `${it.title!.S}`,
          keyboardCnstr([
            [
              {
                text: "More info",
                callback_data: `${it.anime_id!.N}`,
              },
            ],
          ])
        )
      );
    });

    Promise.all(promiseArray).then(() => {
      if (isNextPageAvailable) {
        return bot.sendMessage(chatId, `You still have items to show`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Show more",
                  callback_data: `${lastEvaluatedKey!.chat_id!.N}, ${
                    lastEvaluatedKey!.created_at!.S
                  }, ${lastEvaluatedKey!.anime_id!.N}`,
                },
              ],
            ],
          },
        });
      }
      return;
    });
  } catch (error) {
    throw error;
  }
};

bot.on("message", async (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;

  try {
    if (text === "/random") {
      return await showRandomAnime(chatId);
    }

    if (text === "/start") {
      return await bot.sendMessage(
        chatId,
        "Welcome to Random Anime Bot",
        keyboardCnstr([
          [{ text: "View My Anime List!", callback_data: "list" }],
        ])
      );
    }

    if (text === "/list") {
      return await showPaginatedList(chatId, undefined);
    }

    return await bot.sendMessage(chatId, "I don't know this command!");
  } catch (error) {
    console.log(error);
    return bot.sendMessage(chatId, "Something went wrong. Please try again");
  }
});

bot.on("callback_query", async (msg) => {
  const data = msg.data;
  const chatId = msg.message!.chat.id;
  const text = msg.message!.text;
  const messageId = msg.message?.message_id;

  try {
    if (text === "You still have items to show") {
      let lastEvaluatedKey = {
        chat_id: {
          N: `${data?.split(", ")[0]}`,
        },
        created_at: {
          S: `${data?.split(", ")[1]}`,
        },
        anime_id: {
          N: `${data?.split(", ")[2]}`,
        },
      };

      await bot.deleteMessage(chatId, messageId!);

      return await showPaginatedList(chatId, lastEvaluatedKey);
    }

    if (
      msg.message?.reply_markup?.inline_keyboard[0] &&
      msg.message?.reply_markup?.inline_keyboard[0][0]?.text === "More info"
    ) {
      const animeData = await getAnimeById(data!);

      await bot.editMessageText(
        `Title: ${animeData.data.attributes.canonicalTitle} 
        \nSynopsis: ${animeData.data.attributes.synopsis}`,
        { chat_id: chatId, message_id: messageId }
      );
    }

    if (data === "next") {
      return await showRandomAnime(chatId);
    }

    if (
      msg.message?.reply_markup?.inline_keyboard[1] &&
      msg.message?.reply_markup?.inline_keyboard[1][0]?.text ===
        "Add to my list!"
    ) {
      const title = `${data?.split(", ")[1]}`;
      const animeId = `${data?.split(", ")[0]}`;

      const newAnime = {
        chatId: chatId.toString(),
        animeId,
        title,
      };

      await addAnime(newAnime);

      await bot.sendMessage(
        chatId,
        `Anime ${title} was successfully added to your list`
      );
    }
  } catch (error) {
    console.log(error);
    return bot.sendMessage(chatId, "Something went wrong. Please try again");
  }
});
