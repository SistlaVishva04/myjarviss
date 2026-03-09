// Mock AI responses for the Jarvis assistant
// In a real app, this would call an actual AI API

const responses: Record<string, string[]> = {
  greeting: [
    "Good day, sir. How may I assist you today?",
    "At your service. What can I do for you?",
    "Hello. All systems are operational. How may I help?",
    "Greetings. I'm ready to assist with whatever you need.",
  ],
  weather: [
    "I'm currently unable to access live weather data, but I'd recommend checking your local forecast. Shall I help with something else?",
    "Weather systems are not currently integrated, sir. Perhaps I can assist with another inquiry?",
  ],
  time: [
    `The current time is ${new Date().toLocaleTimeString()}. Is there anything else you need?`,
    `It's ${new Date().toLocaleTimeString()}. How else may I assist you?`,
  ],
  capabilities: [
    "I can assist with various tasks: answering questions, providing information, and helping you think through problems. My voice interface allows natural conversation. What would you like to explore?",
    "My capabilities include voice interaction, information retrieval, and general assistance. I'm here to make your life easier. What's on your mind?",
  ],
  thanks: [
    "You're most welcome, sir. It's my pleasure to assist.",
    "Of course. I'm always here when you need me.",
    "My pleasure. Don't hesitate to call upon me again.",
  ],
  goodbye: [
    "Goodbye, sir. I'll be here when you return.",
    "Until next time. All systems will remain on standby.",
    "Farewell. It was a pleasure assisting you today.",
  ],
  default: [
    "I understand. Let me process that for a moment... Interesting query. While I don't have all the answers, I'm always learning. Is there something specific I can help clarify?",
    "An intriguing question. In my current configuration, I may not have the complete answer, but I'm designed to assist. Could you elaborate or ask in a different way?",
    "Processing your request... I'm analyzing the possibilities. While my knowledge has limits, I strive to be helpful. What aspect would you like me to focus on?",
    "That's a fascinating inquiry. My systems are working on it. For now, is there a related topic I can assist with?",
  ],
};

function getRandomResponse(category: string): string {
  const categoryResponses = responses[category] || responses.default;
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
}

function categorizeInput(input: string): string {
  const lowerInput = input.toLowerCase();

  if (/\b(hello|hi|hey|greetings)\b/.test(lowerInput)) {
    return "greeting";
  }
  if (/\b(weather|temperature|forecast|rain|sunny)\b/.test(lowerInput)) {
    return "weather";
  }
  if (/\b(time|clock|hour)\b/.test(lowerInput)) {
    return "time";
  }
  if (/\b(what can you|capabilities|help me with|what do you do)\b/.test(lowerInput)) {
    return "capabilities";
  }
  if (/\b(thank|thanks|appreciate)\b/.test(lowerInput)) {
    return "thanks";
  }
  if (/\b(bye|goodbye|see you|later)\b/.test(lowerInput)) {
    return "goodbye";
  }

  return "default";
}

export async function getJarvisResponse(input: string): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  const category = categorizeInput(input);
  return getRandomResponse(category);
}
