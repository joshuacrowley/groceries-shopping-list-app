export const TYPES = ['A', 'B', 'C', 'D', 'E'] as const;
export const RATING = [1, 2, 3, 4, 5] as const;
export const BACKGROUND_COLOUR = ['blue', 'green', 'red', 'yellow', 'purple'] as const;

export type TodoType = typeof TYPES[number];
export type Rating = typeof RATING[number];
export type BackgroundColour = typeof BACKGROUND_COLOUR[number];

export const LIST_TYPE = [
  "Info",
  "Home",
  "Life",
  "Food",
  "Stuff",
  "Fun",
  "Health",
  "Learn",
  "Money",
];

export const SCHEMA = {
  todos: {
    list: { type: "string" },
    text: { type: "string" },
    notes: { type: "string" },
    date: { type: "string" },
    time: { type: "string" },
    url: { type: "string" },
    emoji: { type: "string" },
    email: { type: "string" },
    streetAddress: { type: "string" },
    number: { type: "number" },
    amount: { type: "number" },
    fiveStarRating: { type: "number", default: 1, allow: RATING },
    done: { type: "boolean", default: false },
    type: { type: "string", default: "A", allow: TYPES },
    category: { type: "string" },
  },
  lists: {
    name: { type: "string" },
    purpose: { type: "string" },
    systemPrompt: { type: "string" }, // Add this line
    backgroundColour: {
      type: "string",
      default: "blue",
      allow: BACKGROUND_COLOUR,
    },
    icon: { type: "string" },
    number: { type: "number" },
    template: { type: "string" },
    code: { type: "string" },
    type: { type: "string", default: "Info", allow: [...LIST_TYPE, "Offload"] },
  },
};
