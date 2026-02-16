import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const logger = new Logger({ serviceName: "reserve-inventory" });

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBrigdgeClient = new EventBridgeClient({});

const INVENTORY_TABLE = process.env.INVENTORY_TABLE!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

export const handler: EventBridgeHandler = async(ev);
