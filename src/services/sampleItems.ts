// Offline fallback item packs.
//
// These exist ONLY so practice mode and the full game loop are testable before
// the Anthropic API (or Firebase) is configured. When the /api/generate-items
// endpoint is reachable, real generated items are always used instead.
//
// Every item below is a real, verifiable thing that matches its topic — matching
// the same "no invented items" bar the generation model is held to.

import type { Item } from '../types';
import { makeId } from '../utils/misc';

interface Pack {
  match: RegExp;
  items: Array<Omit<Item, 'id'>>;
}

const PACKS: Pack[] = [
  {
    match: /drake|song/i,
    items: [
      { name: "God's Plan", description: 'Drake single from Scorpion (2018).', category: 'Song' },
      { name: 'Hotline Bling', description: 'Drake single (2015), later on Views.', category: 'Song' },
      { name: 'One Dance', description: 'Drake single ft. Wizkid & Kyla, from Views (2016).', category: 'Song' },
      { name: 'Started From the Bottom', description: 'Drake single from Nothing Was the Same (2013).', category: 'Song' },
      { name: 'In My Feelings', description: 'Drake single from Scorpion (2018).', category: 'Song' },
      { name: 'Nice For What', description: 'Drake single from Scorpion (2018).', category: 'Song' },
      { name: 'Passionfruit', description: 'Drake track from More Life (2017).', category: 'Song' },
      { name: 'Marvins Room', description: 'Drake track from Take Care (2011).', category: 'Song' },
      { name: 'Take Care', description: 'Drake title track ft. Rihanna (2011).', category: 'Song' },
      { name: 'Headlines', description: 'Drake single from Take Care (2011).', category: 'Song' },
      { name: 'Best I Ever Had', description: 'Drake breakout single from So Far Gone (2009).', category: 'Song' },
      { name: 'Jumpman', description: 'Drake & Future track from What a Time to Be Alive (2015).', category: 'Song' },
      { name: 'Controlla', description: 'Drake track from Views (2016).', category: 'Song' },
      { name: 'Rich Flex', description: 'Drake & 21 Savage track from Her Loss (2022).', category: 'Song' },
      { name: 'Laugh Now Cry Later', description: 'Drake single ft. Lil Durk (2020).', category: 'Song' },
      { name: 'Toosie Slide', description: 'Drake single (2020).', category: 'Song' },
    ],
  },
  {
    match: /denzel|washington/i,
    items: [
      { name: 'Training Day', description: 'Denzel Washington won Best Actor (2001).', category: 'Movie' },
      { name: 'Malcolm X', description: 'Spike Lee biopic starring Denzel Washington (1992).', category: 'Movie' },
      { name: 'Glory', description: 'Civil War drama; Denzel won Best Supporting Actor (1989).', category: 'Movie' },
      { name: 'Man on Fire', description: 'Tony Scott action thriller (2004).', category: 'Movie' },
      { name: 'American Gangster', description: 'Ridley Scott crime drama (2007).', category: 'Movie' },
      { name: 'The Equalizer', description: 'Action thriller directed by Antoine Fuqua (2014).', category: 'Movie' },
      { name: 'Flight', description: 'Robert Zemeckis drama (2012).', category: 'Movie' },
      { name: 'Remember the Titans', description: 'Football drama (2000).', category: 'Movie' },
      { name: 'Fences', description: 'Denzel directed and starred (2016).', category: 'Movie' },
      { name: 'Inside Man', description: 'Spike Lee heist thriller (2006).', category: 'Movie' },
      { name: 'Crimson Tide', description: 'Submarine thriller (1995).', category: 'Movie' },
      { name: 'The Hurricane', description: 'Boxing biopic (1999).', category: 'Movie' },
      { name: 'Philadelphia', description: 'Legal drama opposite Tom Hanks (1993).', category: 'Movie' },
      { name: 'Déjà Vu', description: 'Tony Scott sci-fi thriller (2006).', category: 'Movie' },
      { name: 'Safe House', description: 'Action thriller with Ryan Reynolds (2012).', category: 'Movie' },
    ],
  },
  {
    match: /jordan|sneaker|shoe/i,
    items: [
      { name: 'Air Jordan 1', description: 'The original 1985 Air Jordan silhouette.', category: 'Sneaker' },
      { name: 'Air Jordan 3', description: '1988 model with the first Jumpman and elephant print.', category: 'Sneaker' },
      { name: 'Air Jordan 4', description: '1989 model, mesh panels and visible Air.', category: 'Sneaker' },
      { name: 'Air Jordan 5', description: '1990 model with reflective tongue.', category: 'Sneaker' },
      { name: 'Air Jordan 6', description: '1991 model worn during MJ’s first title.', category: 'Sneaker' },
      { name: 'Air Jordan 11', description: '1995 patent-leather classic.', category: 'Sneaker' },
      { name: 'Air Jordan 12', description: '1996 model with rising-sun stitching.', category: 'Sneaker' },
      { name: 'Air Jordan 13', description: '1997 model with a "panther paw" outsole.', category: 'Sneaker' },
      { name: 'Air Jordan 7', description: '1992 model worn at the Barcelona Olympics.', category: 'Sneaker' },
      { name: 'Air Jordan 9', description: '1993 model, first released after MJ’s retirement.', category: 'Sneaker' },
    ],
  },
  {
    match: /new orleans|nola|cajun|creole|food/i,
    items: [
      { name: 'Gumbo', description: 'Louisiana stew of roux, okra, and meat or seafood.', category: 'Dish' },
      { name: 'Jambalaya', description: 'Creole/Cajun rice dish with meat and seafood.', category: 'Dish' },
      { name: 'Beignets', description: 'Fried dough with powdered sugar, a Café du Monde staple.', category: 'Dish' },
      { name: 'Po’ boy', description: 'Louisiana sandwich on French bread, often fried shrimp.', category: 'Dish' },
      { name: 'Crawfish étouffée', description: 'Crawfish smothered in a roux-based sauce over rice.', category: 'Dish' },
      { name: 'Muffuletta', description: 'Round Sicilian sandwich with olive salad from NOLA.', category: 'Dish' },
      { name: 'Red beans and rice', description: 'Traditional Monday dish in New Orleans.', category: 'Dish' },
      { name: 'Bananas Foster', description: 'Flambeed banana dessert created at Brennan’s.', category: 'Dish' },
      { name: 'Shrimp Creole', description: 'Shrimp in a tomato-based Creole sauce over rice.', category: 'Dish' },
      { name: 'King cake', description: 'Mardi Gras ring cake with a hidden baby.', category: 'Dish' },
    ],
  },
  {
    match: /horror|movie|film/i,
    items: [
      { name: 'Hereditary', description: 'Ari Aster supernatural horror (2018).', category: 'Movie' },
      { name: 'Get Out', description: 'Jordan Peele social horror (2017).', category: 'Movie' },
      { name: 'The Conjuring', description: 'James Wan haunting film (2013).', category: 'Movie' },
      { name: 'It', description: 'Adaptation of Stephen King’s novel (2017).', category: 'Movie' },
      { name: 'A Quiet Place', description: 'John Krasinski creature thriller (2018).', category: 'Movie' },
      { name: 'The Babadook', description: 'Australian psychological horror (2014).', category: 'Movie' },
      { name: 'Midsommar', description: 'Ari Aster daylight folk horror (2019).', category: 'Movie' },
      { name: 'Sinister', description: 'Scott Derrickson found-footage horror (2012).', category: 'Movie' },
      { name: 'The Witch', description: 'Robert Eggers period horror (2015).', category: 'Movie' },
      { name: 'Us', description: 'Jordan Peele doppelgänger horror (2019).', category: 'Movie' },
      { name: 'Insidious', description: 'James Wan haunting franchise opener (2010).', category: 'Movie' },
      { name: 'It Follows', description: 'David Robert Mitchell horror (2014).', category: 'Movie' },
    ],
  },
];

const GENERIC: Array<Omit<Item, 'id'>> = [
  { name: 'Mount Everest', description: 'Earth’s highest mountain above sea level.', category: 'Place' },
  { name: 'The Great Barrier Reef', description: 'World’s largest coral reef system, off Australia.', category: 'Place' },
  { name: 'The Mona Lisa', description: 'Leonardo da Vinci portrait in the Louvre.', category: 'Art' },
  { name: 'The Eiffel Tower', description: 'Iron lattice tower in Paris, built 1889.', category: 'Landmark' },
  { name: 'Pizza', description: 'Italian dish of flatbread with toppings.', category: 'Food' },
  { name: 'The Beatles', description: 'English rock band formed in Liverpool, 1960.', category: 'Music' },
  { name: 'The Pacific Ocean', description: 'Largest and deepest of Earth’s oceans.', category: 'Place' },
  { name: 'Coffee', description: 'Brewed beverage from roasted coffee beans.', category: 'Food' },
  { name: 'The Grand Canyon', description: 'Steep-sided canyon carved by the Colorado River.', category: 'Place' },
  { name: 'Chess', description: 'Two-player strategy board game.', category: 'Game' },
  { name: 'The Sun', description: 'The star at the center of our solar system.', category: 'Nature' },
  { name: 'Beethoven’s 5th Symphony', description: 'Iconic 1808 orchestral work.', category: 'Music' },
  { name: 'The Colosseum', description: 'Ancient Roman amphitheatre completed 80 AD.', category: 'Landmark' },
  { name: 'Sushi', description: 'Japanese dish of vinegared rice with fish.', category: 'Food' },
  { name: 'The Amazon River', description: 'Largest river by discharge volume, in South America.', category: 'Place' },
];

/** Return a real-item fallback pack for a topic (best-effort keyword match). */
export function sampleItemsForTopic(topic: string): Item[] {
  const pack = PACKS.find((p) => p.match.test(topic));
  const source = pack ? pack.items : GENERIC;
  return source.map((it) => ({ ...it, id: makeId('item') }));
}
