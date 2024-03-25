import bot from "./bot";

module.exports.processWebhookOne = async (event: any) => {
  try {
    const body = JSON.parse(event.body);

    await bot.processUpdate(body);
    return { statusCode: 200, body: "" };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports.setWebhook = async (event: any) => {
  try {
    const url = `https://${event.headers.Host}/${event.requestContext.stage}/webhook`;
    await bot.setWebHook(url);
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ url }),
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

