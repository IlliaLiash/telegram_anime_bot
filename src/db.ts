import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  QueryCommandInput,
  ScanCommandInput,
  ScanCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";

interface INewAnime {
  chatId: string;
  animeId: string;
  title: string;
}

const TABLE_NAME = "RandomAnime";
const INDEX_NAME = "date";

const docClient = new DynamoDBClient({ region: "us-east-1" });

const getAnimeByChatId = async (
  chatId: string,
  lastEvaluatedKey: Record<string, AttributeValue> | undefined
) => {
  try {
    const params: QueryCommandInput = {
      IndexName: INDEX_NAME,
      KeyConditionExpression: "chat_id = :chatId",
      ExpressionAttributeValues: {
        ":chatId": { N: chatId },
      },
      TableName: TABLE_NAME,
      Limit: 5,
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const command = new QueryCommand(params);
    const data = await docClient.send(command);

    const scanParams: ScanCommandInput = {
      IndexName: INDEX_NAME,
      TableName: TABLE_NAME,
      Limit: 1,
      ExclusiveStartKey: data.LastEvaluatedKey,
      Select: "COUNT",
    };

    const scanCommand = new ScanCommand(scanParams);

    const scanData = await docClient.send(scanCommand);

    const isNextPageAvailable: boolean =
      !scanData.Count || data.LastEvaluatedKey === undefined ? false : true;

    return {
      isNextPageAvailable,
      items: data.Items,
      lastEvaluatedKey: data.LastEvaluatedKey,
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const addAnime = async (newAnime: INewAnime) => {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      chat_id: { N: newAnime.chatId },
      anime_id: { N: newAnime.animeId },
      title: { S: newAnime.title },
      created_at: { S: new Date().toISOString() },
    },
  };

  try {
    const command = new PutItemCommand(params);

    return await docClient.send(command);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export { addAnime, getAnimeByChatId };
