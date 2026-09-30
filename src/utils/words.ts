export interface WordCategory {
  id: string;
  name: string;
  words: string[];
}

export const WORD_CATEGORIES: Record<string, string[]> = {
  Animals: [
    'Elephant', 'Penguin', 'Kangaroo', 'Chameleon', 'Octopus',
    'Giraffe', 'Sloth', 'Flamingo', 'Hedgehog', 'Owl',
    'Dolphin', 'Koala', 'Lion', 'Crocodile', 'Bat',
    'Shark', 'Peacock', 'Turtle', 'Wolf', 'Panda'
  ],
  Food: [
    'Pizza', 'Sushi', 'Taco', 'Ice Cream', 'Croissant',
    'Hamburger', 'Pancake', 'Cupcake', 'Watermelon', 'Donut',
    'Burrito', 'Spaghetti', 'Popcorn', 'Hot Dog', 'Chocolate',
    'Pineapple', 'Pretzel', 'Avocado', 'Ramen', 'Cookie'
  ],
  Objects: [
    'Telescope', 'Guitar', 'Backpack', 'Umbrella', 'Clock',
    'Flashlight', 'Anchor', 'Compass', 'Camera', 'Key',
    'Hourglass', 'Microphone', 'Compass', 'Binoculars', 'Lantern',
    'Boombox', 'Treasure Chest', 'Crown', 'Sword', 'Shield'
  ],
  Places: [
    'Pyramid', 'Lighthouse', 'Volcano', 'Castle', 'Igloo',
    'Space Station', 'Desert', 'Island', 'Haunted House', 'Waterfall',
    'Airport', 'Amusement Park', 'Colosseum', 'Submarine', 'Cave',
    'Windmill', 'Campfire', 'Treehouse', 'Ski Resort', 'Moon Base'
  ],
  Characters: [
    'Wizard', 'Superhero', 'Pirate', 'Robot', 'Astronaut',
    'Ninja', 'Dragon', 'Vampire', 'Detective', 'Mermaid',
    'Knight', 'Alien', 'Zombie', 'Samurai', 'Genie',
    'King', 'Fairy', 'Gladiator', 'Ghost', 'Mad Scientist'
  ],
  Sports: [
    'Basketball', 'Surfing', 'Archery', 'Skateboard', 'Bowling',
    'Tennis', 'Boxing', 'Snowboard', 'Gymnastics', 'Soccer',
    'Volleyball', 'Golf', 'Baseball', 'Fishing', 'Rock Climbing',
    'Curling', 'Badminton', 'Diving', 'Kayaking', 'Ice Hockey'
  ],
  Everyday: [
    'Toothbrush', 'Glasses', 'Scissors', 'Coffee Mug', 'Headphones',
    'Pillow', 'Desk Lamp', 'Bicycle', 'Sneakers', 'Mirror',
    'Hairdryer', 'Suitcase', 'Alarm Clock', 'Candle', 'Teapot',
    'Broom', 'Wristwatch', 'Iron', 'Toaster', 'Hammer'
  ]
};

export function getRandomWord(category?: string, usedWords: string[] = []): { word: string; category: string } {
  let catName = category;
  if (!catName || catName === 'Random Mix' || catName === 'All' || !WORD_CATEGORIES[catName]) {
    const catKeys = Object.keys(WORD_CATEGORIES);
    catName = catKeys[Math.floor(Math.random() * catKeys.length)];
  }

  const list = WORD_CATEGORIES[catName] || WORD_CATEGORIES['Animals'];
  const available = list.filter(w => !usedWords.includes(w.toLowerCase()));
  const pool = available.length > 0 ? available : list;

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return { word: chosen, category: catName };
}

export function isGuessCorrect(guess: string, targetWord: string): boolean {
  if (!guess || !targetWord) return false;
  const cleanGuess = guess.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const cleanTarget = targetWord.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  if (cleanGuess === cleanTarget) return true;

  // Handle simple plurals
  if (cleanGuess + 's' === cleanTarget || cleanTarget + 's' === cleanGuess) return true;

  return false;
}
