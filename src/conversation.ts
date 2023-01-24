// import { ChatGPTAPI, ChatGPTConversation } from 'chatgpt';
import { Configuration, OpenAIApi } from 'openai';
import { env } from './utils/env';

// store conversation
// const memory = new Map<string, ChatGPTConversation>();

// const api = new ChatGPTAPI({
//   sessionToken: env.OPENAI_SECRET_KEY,
// });

const configuration = new Configuration({
  organization: env.OPENAI_ORG_ID,
  apiKey: env.OPENAI_SECRET_KEY,
});
const openai = new OpenAIApi(configuration);

const check = () => {
  // return api.ensureAuth();
  return true;
};

/**
 * send message to chatGPT
 */
export const send = async (
  id: number | string,
  context: string,
  onResponse?: (contents: string) => void,
) => {
  const sId = id.toString();
  console.log({ sId });
  // let conversation = memory.get(sId);

  // if (!conversation) {
  //   conversation = await create(sId);
  // }

  // TODO: send a message to a ChatGPT
  const aiResponse = await sendMessageToChatGPT(context);
  const message = aiResponse || '';

  // onResponse?.(even.message?.content.parts[0] || '');

  onResponse?.(message);

  return message;

  // return conversation.sendMessage(context, {
  //   timeoutMs: 2 * 60 * 1000,
  //   onConversationResponse(even) {
  //     onResponse?.(even.message?.content.parts[0] || '');
  //   },
  // });
};

export async function sendMessageToChatGPT(msg: string) {
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.
Human: ${msg}
AI: 
`,
    max_tokens: 1000,
    temperature: 0.9,
  });
  console.log(response.data.choices[0]);
  return response.data.choices[0].text;
}

/**
 * create a new conversation
 */
export const create = async (id: number | string) => {
  const sId = id.toString();
  // const conversation = api.getConversation();
  // await check();
  // memory.set(sId, conversation);
  // return conversation;
  return 42;
};
