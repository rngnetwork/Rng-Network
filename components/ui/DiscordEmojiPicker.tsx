"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Sparkles, Smile, Gamepad2, User, Trees, Utensils, Plane, Wrench, Heart } from 'lucide-react';

export interface EmojiItem {
  emoji: string;
  name: string;
  shortcode: string;
  keywords: string[];
  category: 'custom' | 'smileys' | 'gaming' | 'people' | 'nature' | 'food' | 'travel' | 'objects' | 'symbols';
}

export const EMOJI_DATABASE: EmojiItem[] = [
  // 👑 CUSTOM SERVER EMOJIS
  { emoji: '👑', name: 'Crown', shortcode: ':crown:', keywords: ['crown', 'king', 'queen', 'leader', 'vip', 'royal', 'owner', 'boss'], category: 'custom' },
  { emoji: '🔥', name: 'Fire', shortcode: ':fire:', keywords: ['fire', 'flame', 'hot', 'lit', 'burn', 'blaze'], category: 'custom' },
  { emoji: '⚔️', name: 'Crossed Swords', shortcode: ':crossed_swords:', keywords: ['sword', 'swords', 'battle', 'pvp', 'war', 'fight', 'weapon', 'duel'], category: 'custom' },
  { emoji: '🛡️', name: 'Shield', shortcode: ':shield:', keywords: ['shield', 'defense', 'protect', 'protection', 'guard', 'armor', 'safe'], category: 'custom' },
  { emoji: '💎', name: 'Gem Stone', shortcode: ':gem:', keywords: ['diamond', 'gem', 'crystal', 'boost', 'nitro', 'premium', 'rich'], category: 'custom' },
  { emoji: '🏆', name: 'Trophy', shortcode: ':trophy:', keywords: ['trophy', 'champion', 'winner', 'win', 'first', 'esports', 'tournament', 'prize'], category: 'custom' },
  { emoji: '⚡', name: 'High Voltage', shortcode: ':zap:', keywords: ['lightning', 'zap', 'thunder', 'volt', 'energy', 'fast', 'power', 'electric'], category: 'custom' },
  { emoji: '🎯', name: 'Bullseye', shortcode: ':dart:', keywords: ['target', 'aim', 'sniper', 'bullseye', 'dart', 'accuracy', 'focus'], category: 'custom' },
  { emoji: '💀', name: 'Skull', shortcode: ':skull:', keywords: ['skull', 'death', 'dead', 'skeleton', 'danger', 'rip', 'corpse'], category: 'custom' },
  { emoji: '🍿', name: 'Popcorn', shortcode: ':popcorn:', keywords: ['popcorn', 'movie', 'cinema', 'watch', 'party', 'snack'], category: 'custom' },
  { emoji: '🤖', name: 'Robot', shortcode: ':robot:', keywords: ['robot', 'bot', 'ai', 'tech', 'automation', 'droid'], category: 'custom' },
  { emoji: '🩸', name: 'Drop of Blood', shortcode: ':drop_of_blood:', keywords: ['blood', 'bleed', 'red', 'rng', 'crimson'], category: 'custom' },
  { emoji: '🚀', name: 'Rocket', shortcode: ':rocket:', keywords: ['rocket', 'boost', 'launch', 'space', 'speed', 'fly', 'fast'], category: 'custom' },
  { emoji: '🌟', name: 'Glowing Star', shortcode: ':star2:', keywords: ['star', 'sparkle', 'glowing', 'vip', 'favorite', 'special'], category: 'custom' },
  { emoji: '🎮', name: 'Video Game', shortcode: ':video_game:', keywords: ['game', 'gaming', 'gamer', 'controller', 'play', 'console', 'pad'], category: 'custom' },
  { emoji: '👾', name: 'Alien Monster', shortcode: ':space_invader:', keywords: ['alien', 'arcade', 'retro', 'monster', 'gaming', 'invader'], category: 'custom' },
  { emoji: '🎖️', name: 'Military Medal', shortcode: ':military_medal:', keywords: ['medal', 'veteran', 'honor', 'rank', 'officer'], category: 'custom' },
  { emoji: '🔮', name: 'Crystal Ball', shortcode: ':crystal_ball:', keywords: ['crystal', 'magic', 'oracle', 'future', 'mystic', 'psychic'], category: 'custom' },
  { emoji: '🛸', name: 'Flying Saucer', shortcode: ':flying_saucer:', keywords: ['ufo', 'alien', 'spaceship', 'space'], category: 'custom' },
  { emoji: '💯', name: 'Hundred Points', shortcode: ':100:', keywords: ['100', 'hundred', 'perfect', 'score', 'keep it 100'], category: 'custom' },
  { emoji: '🗿', name: 'Moai', shortcode: ':moyai:', keywords: ['statue', 'stone', 'sigma', 'chad', 'meme', 'rock'], category: 'custom' },
  { emoji: '🚩', name: 'Triangular Flag', shortcode: ':triangular_flag_on_post:', keywords: ['flag', 'red flag', 'point', 'mark', 'banner'], category: 'custom' },

  // 😀 SMILEYS & EMOTIONS
  { emoji: '😀', name: 'Grinning Face', shortcode: ':grinning:', keywords: ['smile', 'happy', 'grin', 'joy'], category: 'smileys' },
  { emoji: '😃', name: 'Grinning Face with Big Eyes', shortcode: ':smiley:', keywords: ['happy', 'joy', 'smile', 'excited'], category: 'smileys' },
  { emoji: '😄', name: 'Grinning Face with Smiling Eyes', shortcode: ':smile:', keywords: ['happy', 'laugh', 'joy', 'smile'], category: 'smileys' },
  { emoji: '😁', name: 'Beaming Face with Smiling Eyes', shortcode: ':grin:', keywords: ['teeth', 'happy', 'grin', 'cheerful'], category: 'smileys' },
  { emoji: '😆', name: 'Grinning Squinting Face', shortcode: ':laughing:', keywords: ['laugh', 'happy', 'haha', 'lmao', 'xd'], category: 'smileys' },
  { emoji: '😅', name: 'Grinning Face with Sweat', shortcode: ':sweat_smile:', keywords: ['nervous', 'phew', 'relief', 'sweat', 'whew'], category: 'smileys' },
  { emoji: '🤣', name: 'Rolling on the Floor Laughing', shortcode: ':rofl:', keywords: ['rofl', 'laugh', 'funny', 'hilarious', 'lmao'], category: 'smileys' },
  { emoji: '😂', name: 'Face with Tears of Joy', shortcode: ':joy:', keywords: ['joy', 'tears', 'crying laughing', 'lol', 'funny'], category: 'smileys' },
  { emoji: '🙂', name: 'Slightly Smiling Face', shortcode: ':slight_smile:', keywords: ['smile', 'calm', 'fine', 'pleasant'], category: 'smileys' },
  { emoji: '😉', name: 'Winking Face', shortcode: ':wink:', keywords: ['wink', 'playful', 'joke', 'flirt'], category: 'smileys' },
  { emoji: '😊', name: 'Smiling Face with Smiling Eyes', shortcode: ':blush:', keywords: ['blush', 'sweet', 'happy', 'warm', 'friendly'], category: 'smileys' },
  { emoji: '😇', name: 'Smiling Face with Halo', shortcode: ':innocent:', keywords: ['angel', 'halo', 'pure', 'good', 'innocent'], category: 'smileys' },
  { emoji: '🥰', name: 'Smiling Face with Hearts', shortcode: ':smiling_face_with_3_hearts:', keywords: ['love', 'adore', 'hearts', 'affection', 'crush'], category: 'smileys' },
  { emoji: '😍', name: 'Heart Eyes Face', shortcode: ':heart_eyes:', keywords: ['love', 'infatuation', 'heart', 'crush', 'gorgeous'], category: 'smileys' },
  { emoji: '🤩', name: 'Star-Struck', shortcode: ':star_struck:', keywords: ['star', 'excited', 'amazed', 'wow', 'fascinated'], category: 'smileys' },
  { emoji: '😘', name: 'Face Blowing a Kiss', shortcode: ':kissing_heart:', keywords: ['kiss', 'love', 'flirt', 'smooch'], category: 'smileys' },
  { emoji: '😋', name: 'Face Savoring Food', shortcode: ':yum:', keywords: ['yum', 'delicious', 'tasty', 'food', 'tongue'], category: 'smileys' },
  { emoji: '😜', name: 'Winking Face with Tongue', shortcode: ':stuck_out_tongue_winking_eye:', keywords: ['tongue', 'wink', 'crazy', 'joke', 'silly'], category: 'smileys' },
  { emoji: '🤪', name: 'Zany Face', shortcode: ':zany_face:', keywords: ['crazy', 'wild', 'party', 'funny', 'goofy'], category: 'smileys' },
  { emoji: '🤑', name: 'Money-Mouth Face', shortcode: ':money_mouth:', keywords: ['money', 'rich', 'dollar', 'cash', 'wealth'], category: 'smileys' },
  { emoji: '🤗', name: 'Hugging Face', shortcode: ':hugging:', keywords: ['hug', 'welcome', 'warm', 'friendly'], category: 'smileys' },
  { emoji: '🤫', name: 'Shushing Face', shortcode: ':shushing_face:', keywords: ['shh', 'quiet', 'secret', 'silence', 'hush'], category: 'smileys' },
  { emoji: '🤔', name: 'Thinking Face', shortcode: ':thinking:', keywords: ['think', 'ponder', 'hmm', 'curious', 'question'], category: 'smileys' },
  { emoji: '🤐', name: 'Zipper-Mouth Face', shortcode: ':zipper_mouth:', keywords: ['zipper', 'silent', 'secret', 'mute', 'quiet'], category: 'smileys' },
  { emoji: '🤨', name: 'Face with Raised Eyebrow', shortcode: ':raised_eyebrow:', keywords: ['suspicious', 'doubt', 'skeptical', 'really'], category: 'smileys' },
  { emoji: '😐', name: 'Neutral Face', shortcode: ':neutral_face:', keywords: ['neutral', 'meh', 'pokerface', 'blank'], category: 'smileys' },
  { emoji: '😏', name: 'Smirking Face', shortcode: ':smirk:', keywords: ['smirk', 'smug', 'sly', 'flirt'], category: 'smileys' },
  { emoji: '😒', name: 'Unamused Face', shortcode: ':unamused:', keywords: ['unamused', 'annoyed', 'boring', 'unimpressed'], category: 'smileys' },
  { emoji: '🙄', name: 'Face with Rolling Eyes', shortcode: ':roll_eyes:', keywords: ['eyeroll', 'frustrated', 'whatever', 'bored'], category: 'smileys' },
  { emoji: '😬', name: 'Grimacing Face', shortcode: ':grimacing:', keywords: ['grimace', 'awkward', 'cringe', 'ouch', 'nervous'], category: 'smileys' },
  { emoji: '😌', name: 'Relieved Face', shortcode: ':relieved:', keywords: ['relieved', 'calm', 'peaceful', 'relaxed'], category: 'smileys' },
  { emoji: '😴', name: 'Sleeping Face', shortcode: ':sleeping:', keywords: ['sleep', 'tired', 'zzz', 'night', 'bed'], category: 'smileys' },
  { emoji: '😷', name: 'Face with Medical Mask', shortcode: ':mask:', keywords: ['mask', 'sick', 'virus', 'doctor'], category: 'smileys' },
  { emoji: '🥵', name: 'Hot Face', shortcode: ':hot_face:', keywords: ['hot', 'heat', 'summer', 'sweat', 'warm'], category: 'smileys' },
  { emoji: '🥶', name: 'Cold Face', shortcode: ':cold_face:', keywords: ['cold', 'freezing', 'winter', 'ice', 'frost'], category: 'smileys' },
  { emoji: '🤯', name: 'Exploding Head', shortcode: ':exploding_head:', keywords: ['mindblown', 'shocked', 'boom', 'explode', 'insane'], category: 'smileys' },
  { emoji: '🥳', name: 'Partying Face', shortcode: ':partying_face:', keywords: ['party', 'celebrate', 'birthday', 'horn', 'cheers'], category: 'smileys' },
  { emoji: '😎', name: 'Smiling Face with Sunglasses', shortcode: ':sunglasses:', keywords: ['cool', 'sunglasses', 'boss', 'chill', 'slick'], category: 'smileys' },
  { emoji: '🤓', name: 'Nerd Face', shortcode: ':nerd:', keywords: ['nerd', 'geek', 'smart', 'glasses', 'study'], category: 'smileys' },
  { emoji: '🧐', name: 'Face with Monocle', shortcode: ':monocle:', keywords: ['monocle', 'classy', 'investigate', 'curious', 'formal'], category: 'smileys' },
  { emoji: '😕', name: 'Confused Face', shortcode: ':confused:', keywords: ['confused', 'lost', 'puzzled', 'uncertain'], category: 'smileys' },
  { emoji: '🥺', name: 'Pleading Face', shortcode: ':pleading_face:', keywords: ['pleading', 'begging', 'puppy', 'please', 'cute', 'eyes'], category: 'smileys' },
  { emoji: '😮', name: 'Face with Open Mouth', shortcode: ':open_mouth:', keywords: ['surprise', 'wow', 'gasp', 'omg'], category: 'smileys' },
  { emoji: '😲', name: 'Astonished Face', shortcode: ':astonished:', keywords: ['shocked', 'astonished', 'amazed', 'omg'], category: 'smileys' },
  { emoji: '😳', name: 'Flushed Face', shortcode: ':flushed:', keywords: ['flushed', 'blush', 'embarrassed', 'shock'], category: 'smileys' },
  { emoji: '😱', name: 'Face Screaming in Fear', shortcode: ':scream:', keywords: ['scream', 'fear', 'scared', 'shock', 'omg'], category: 'smileys' },
  { emoji: '😭', name: 'Loudly Crying Face', shortcode: ':sob:', keywords: ['crying', 'sob', 'tears', 'sad', 'pain'], category: 'smileys' },
  { emoji: '😤', name: 'Face with Steam From Nose', shortcode: ':triumph:', keywords: ['triumph', 'pride', 'steam', 'anger', 'determined'], category: 'smileys' },
  { emoji: '😡', name: 'Pouting Face', shortcode: ':rage:', keywords: ['rage', 'angry', 'mad', 'furious'], category: 'smileys' },
  { emoji: '🤬', name: 'Face with Symbols on Mouth', shortcode: ':cursing_face:', keywords: ['curse', 'swear', 'rage', 'furious'], category: 'smileys' },
  { emoji: '😈', name: 'Smiling Face with Horns', shortcode: ':smiling_imp:', keywords: ['devil', 'horns', 'evil', 'naughty'], category: 'smileys' },
  { emoji: '👿', name: 'Angry Face with Horns', shortcode: ':imp:', keywords: ['devil', 'demon', 'angry', 'horns'], category: 'smileys' },
  { emoji: '🤡', name: 'Clown Face', shortcode: ':clown:', keywords: ['clown', 'joke', 'fool', 'circus', 'funny'], category: 'smileys' },
  { emoji: '👻', name: 'Ghost', shortcode: ':ghost:', keywords: ['ghost', 'spooky', 'halloween', 'boo', 'spirit'], category: 'smileys' },
  { emoji: '👽', name: 'Alien', shortcode: ':alien:', keywords: ['alien', 'extraterrestrial', 'ufo', 'space'], category: 'smileys' },

  // 🎮 GAMING & ACTIVITIES
  { emoji: '🕹️', name: 'Joystick', shortcode: ':joystick:', keywords: ['joystick', 'arcade', 'retro', 'gaming', 'stick', 'control'], category: 'gaming' },
  { emoji: '🎲', name: 'Game Die', shortcode: ':game_die:', keywords: ['dice', 'die', 'boardgame', 'random', 'gamble', 'luck', 'rpg'], category: 'gaming' },
  { emoji: '🎳', name: 'Bowling', shortcode: ':bowling:', keywords: ['bowling', 'strike', 'pins', 'ball'], category: 'gaming' },
  { emoji: '🎰', name: 'Slot Machine', shortcode: ':slot_machine:', keywords: ['slots', 'casino', 'gamble', '777', 'jackpot'], category: 'gaming' },
  { emoji: '🎧', name: 'Headphone', shortcode: ':headphones:', keywords: ['headphones', 'headset', 'music', 'audio', 'sound', 'listen', 'gaming'], category: 'gaming' },
  { emoji: '💻', name: 'Laptop', shortcode: ':laptop:', keywords: ['laptop', 'pc', 'computer', 'tech', 'work', 'code', 'setup'], category: 'gaming' },
  { emoji: '🎬', name: 'Clapper Board', shortcode: ':clapper:', keywords: ['movie', 'film', 'cinema', 'video', 'stream'], category: 'gaming' },
  { emoji: '🎤', name: 'Microphone', shortcode: ':microphone:', keywords: ['microphone', 'mic', 'sing', 'voice', 'talk', 'stream'], category: 'gaming' },
  { emoji: '🎨', name: 'Artist Palette', shortcode: ':art:', keywords: ['art', 'draw', 'paint', 'design', 'artist', 'creative'], category: 'gaming' },
  { emoji: '🥊', name: 'Boxing Glove', shortcode: ':boxing_glove:', keywords: ['boxing', 'fight', 'punch', 'combat', 'match'], category: 'gaming' },
  { emoji: '🏹', name: 'Bow and Arrow', shortcode: ':bow_and_arrow:', keywords: ['archery', 'bow', 'arrow', 'ranger', 'weapon'], category: 'gaming' },
  { emoji: '🥋', name: 'Martial Arts Uniform', shortcode: ':martial_arts_uniform:', keywords: ['karate', 'judo', 'fight', 'dojo'], category: 'gaming' },
  { emoji: '🛹', name: 'Skateboard', shortcode: ':skateboard:', keywords: ['skateboard', 'skate', 'board', 'street'], category: 'gaming' },
  { emoji: '⚽', name: 'Soccer Ball', shortcode: ':soccer:', keywords: ['soccer', 'football', 'fifa', 'ball', 'sport'], category: 'gaming' },
  { emoji: '🏀', name: 'Basketball', shortcode: ':basketball:', keywords: ['basketball', 'nba', 'hoop', 'ball', 'sport'], category: 'gaming' },
  { emoji: '🏈', name: 'American Football', shortcode: ':football:', keywords: ['football', 'nfl', 'touchdown', 'ball'], category: 'gaming' },
  { emoji: '⚾', name: 'Baseball', shortcode: ':baseball:', keywords: ['baseball', 'bat', 'mlb', 'ball'], category: 'gaming' },
  { emoji: '🎾', name: 'Tennis', shortcode: ':tennis:', keywords: ['tennis', 'racket', 'court', 'match'], category: 'gaming' },
  { emoji: '🎱', name: 'Pool 8 Ball', shortcode: ':8ball:', keywords: ['8ball', 'billiards', 'pool', 'eightball'], category: 'gaming' },
  { emoji: '🏓', name: 'Ping Pong', shortcode: ':ping_pong:', keywords: ['ping pong', 'table tennis', 'paddle'], category: 'gaming' },
  { emoji: '🥇', name: '1st Place Medal', shortcode: ':first_place:', keywords: ['gold', 'winner', 'first', 'champion', 'medal'], category: 'gaming' },
  { emoji: '🥈', name: '2nd Place Medal', shortcode: ':second_place:', keywords: ['silver', 'second', 'medal'], category: 'gaming' },
  { emoji: '🥉', name: '3rd Place Medal', shortcode: ':third_place:', keywords: ['bronze', 'third', 'medal'], category: 'gaming' },
  { emoji: '🎪', name: 'Circus Tent', shortcode: ':circus_tent:', keywords: ['circus', 'carnival', 'festival', 'event'], category: 'gaming' },
  { emoji: '🎟️', name: 'Admission Tickets', shortcode: ':tickets:', keywords: ['ticket', 'event', 'pass', 'vip', 'admission'], category: 'gaming' },

  // 👋 PEOPLE & GESTURES
  { emoji: '👋', name: 'Waving Hand', shortcode: ':wave:', keywords: ['wave', 'hello', 'hi', 'bye', 'welcome'], category: 'people' },
  { emoji: '👍', name: 'Thumbs Up', shortcode: ':thumbsup:', keywords: ['thumbsup', 'yes', 'good', 'agree', 'like', 'approve', 'up'], category: 'people' },
  { emoji: '👎', name: 'Thumbs Down', shortcode: ':thumbsdown:', keywords: ['thumbsdown', 'no', 'bad', 'dislike', 'disapprove', 'down'], category: 'people' },
  { emoji: '✌️', name: 'Victory Hand', shortcode: ':v:', keywords: ['peace', 'victory', 'two', 'peace out'], category: 'people' },
  { emoji: '🤞', name: 'Crossed Fingers', shortcode: ':crossed_fingers:', keywords: ['luck', 'hope', 'wish', 'promise'], category: 'people' },
  { emoji: '🤟', name: 'Love-You Gesture', shortcode: ':love_you_gesture:', keywords: ['love', 'ily', 'rock on'], category: 'people' },
  { emoji: '🤘', name: 'Sign of the Horns', shortcode: ':metal:', keywords: ['rock', 'metal', 'horns', 'hardcore'], category: 'people' },
  { emoji: '🤙', name: 'Call Me Hand', shortcode: ':call_me:', keywords: ['shaka', 'call', 'chill', 'bro', 'hang loose'], category: 'people' },
  { emoji: '👌', name: 'OK Hand', shortcode: ':ok_hand:', keywords: ['ok', 'perfect', 'fine', 'agree'], category: 'people' },
  { emoji: '🤌', name: 'Pinched Fingers', shortcode: ':pinched_fingers:', keywords: ['italian', 'what do you want', 'gesture'], category: 'people' },
  { emoji: '👏', name: 'Clapping Hands', shortcode: ':clap:', keywords: ['clap', 'applause', 'praise', 'bravo', 'congrats'], category: 'people' },
  { emoji: '🙌', name: 'Raising Hands', shortcode: ':raised_hands:', keywords: ['raise hands', 'celebrate', 'hooray', 'yay', 'praise'], category: 'people' },
  { emoji: '🤝', name: 'Handshake', shortcode: ':handshake:', keywords: ['handshake', 'deal', 'agreement', 'partner', 'friend'], category: 'people' },
  { emoji: '🙏', name: 'Folded Hands', shortcode: ':pray:', keywords: ['pray', 'please', 'thank you', 'thanks', 'bless'], category: 'people' },
  { emoji: '💪', name: 'Flexed Biceps', shortcode: ':muscle:', keywords: ['muscle', 'strong', 'flex', 'power', 'gym', 'bicep'], category: 'people' },
  { emoji: '👀', name: 'Eyes', shortcode: ':eyes:', keywords: ['eyes', 'look', 'watch', 'see', 'peek', 'look here'], category: 'people' },
  { emoji: '🧠', name: 'Brain', shortcode: ':brain:', keywords: ['brain', 'smart', 'mind', 'iq', 'genius', 'think'], category: 'people' },

  // 🐶 ANIMALS & NATURE
  { emoji: '🐶', name: 'Dog Face', shortcode: ':dog:', keywords: ['dog', 'puppy', 'pet', 'doggo', 'woof'], category: 'nature' },
  { emoji: '🐱', name: 'Cat Face', shortcode: ':cat:', keywords: ['cat', 'kitten', 'kitty', 'pet', 'meow'], category: 'nature' },
  { emoji: '🦊', name: 'Fox', shortcode: ':fox:', keywords: ['fox', 'cunning', 'wild', 'animal'], category: 'nature' },
  { emoji: '🐻', name: 'Bear', shortcode: ':bear:', keywords: ['bear', 'grizzly', 'wild', 'teddy'], category: 'nature' },
  { emoji: '🐼', name: 'Panda', shortcode: ':panda_face:', keywords: ['panda', 'bamboo', 'bear', 'cute'], category: 'nature' },
  { emoji: '🦁', name: 'Lion', shortcode: ':lion:', keywords: ['lion', 'king', 'safari', 'wild', 'mane'], category: 'nature' },
  { emoji: '🐯', name: 'Tiger Face', shortcode: ':tiger:', keywords: ['tiger', 'cat', 'wild', 'stripes'], category: 'nature' },
  { emoji: '🐺', name: 'Wolf', shortcode: ':wolf:', keywords: ['wolf', 'howl', 'pack', 'wild', 'alpha'], category: 'nature' },
  { emoji: '🦅', name: 'Eagle', shortcode: ':eagle:', keywords: ['eagle', 'bird', 'freedom', 'america', 'fly'], category: 'nature' },
  { emoji: '🦉', name: 'Owl', shortcode: ':owl:', keywords: ['owl', 'wise', 'night', 'bird'], category: 'nature' },
  { emoji: '🦇', name: 'Bat', shortcode: ':bat:', keywords: ['bat', 'vampire', 'night', 'spooky'], category: 'nature' },
  { emoji: '🦈', name: 'Shark', shortcode: ':shark:', keywords: ['shark', 'ocean', 'sea', 'predator', 'jaws'], category: 'nature' },
  { emoji: '🐉', name: 'Dragon', shortcode: ':dragon:', keywords: ['dragon', 'myth', 'beast', 'fire', 'legend'], category: 'nature' },
  { emoji: '🌲', name: 'Evergreen Tree', shortcode: ':evergreen_tree:', keywords: ['tree', 'forest', 'wood', 'pine', 'nature'], category: 'nature' },
  { emoji: '🍀', name: 'Four Leaf Clover', shortcode: ':four_leaf_clover:', keywords: ['clover', 'luck', 'lucky', 'irish', 'green'], category: 'nature' },
  { emoji: '🌸', name: 'Cherry Blossom', shortcode: ':cherry_blossom:', keywords: ['flower', 'cherry blossom', 'sakura', 'pink', 'spring'], category: 'nature' },

  // 🍔 FOOD & DRINK
  { emoji: '🍕', name: 'Pizza', shortcode: ':pizza:', keywords: ['pizza', 'slice', 'cheese', 'fastfood', 'food'], category: 'food' },
  { emoji: '🍔', name: 'Hamburger', shortcode: ':hamburger:', keywords: ['burger', 'hamburger', 'cheeseburger', 'food', 'beef'], category: 'food' },
  { emoji: '🍟', name: 'French Fries', shortcode: ':fries:', keywords: ['fries', 'french fries', 'chips', 'potato', 'snack'], category: 'food' },
  { emoji: '🌭', name: 'Hot Dog', shortcode: ':hotdog:', keywords: ['hotdog', 'sausage', 'frank', 'food'], category: 'food' },
  { emoji: '🌮', name: 'Taco', shortcode: ':taco:', keywords: ['taco', 'mexican', 'food', 'snack'], category: 'food' },
  { emoji: '🍜', name: 'Steaming Bowl', shortcode: ':ramen:', keywords: ['ramen', 'noodles', 'soup', 'bowl', 'asian'], category: 'food' },
  { emoji: '🍣', name: 'Sushi', shortcode: ':sushi:', keywords: ['sushi', 'japanese', 'fish', 'rice', 'salmon'], category: 'food' },
  { emoji: '🍦', name: 'Soft Ice Cream', shortcode: ':icecream:', keywords: ['icecream', 'dessert', 'sweet', 'cone'], category: 'food' },
  { emoji: '🍩', name: 'Doughnut', shortcode: ':doughnut:', keywords: ['donut', 'doughnut', 'sweet', 'pastry'], category: 'food' },
  { emoji: '🍪', name: 'Cookie', shortcode: ':cookie:', keywords: ['cookie', 'chocolate', 'biscuit', 'snack'], category: 'food' },
  { emoji: '🎂', name: 'Birthday Cake', shortcode: ':birthday:', keywords: ['cake', 'birthday', 'celebration', 'party'], category: 'food' },
  { emoji: '☕', name: 'Hot Beverage', shortcode: ':coffee:', keywords: ['coffee', 'tea', 'cafe', 'morning', 'cup'], category: 'food' },
  { emoji: '🧋', name: 'Bubble Tea', shortcode: ':boba:', keywords: ['boba', 'bubble tea', 'milktea', 'tapioca'], category: 'food' },
  { emoji: '🍺', name: 'Beer Mug', shortcode: ':beer:', keywords: ['beer', 'alcohol', 'cheers', 'pub', 'drink'], category: 'food' },
  { emoji: '🍻', name: 'Clinking Beer Mugs', shortcode: ':beers:', keywords: ['beers', 'party', 'cheers', 'drinks'], category: 'food' },
  { emoji: '🍷', name: 'Wine Glass', shortcode: ':wine_glass:', keywords: ['wine', 'drink', 'grape', 'red wine'], category: 'food' },

  // 🚗 TRAVEL & PLACES
  { emoji: '🚗', name: 'Automobile', shortcode: ':car:', keywords: ['car', 'automobile', 'drive', 'vehicle'], category: 'travel' },
  { emoji: '🏎️', name: 'Racing Car', shortcode: ':racing_car:', keywords: ['race car', 'racing', 'f1', 'speed', 'fast'], category: 'travel' },
  { emoji: '🏍️', name: 'Motorcycle', shortcode: ':motorcycle:', keywords: ['bike', 'motorcycle', 'speed', 'ride'], category: 'travel' },
  { emoji: '✈️', name: 'Airplane', shortcode: ':airplane:', keywords: ['plane', 'airplane', 'flight', 'travel', 'fly'], category: 'travel' },
  { emoji: '🏖️', name: 'Beach with Umbrella', shortcode: ':beach:', keywords: ['beach', 'summer', 'vacation', 'ocean', 'sun'], category: 'travel' },
  { emoji: '🏰', name: 'Castle', shortcode: ':castle:', keywords: ['castle', 'fortress', 'kingdom', 'royal', 'medieval'], category: 'travel' },
  { emoji: '🏟️', name: 'Stadium', shortcode: ':stadium:', keywords: ['stadium', 'arena', 'match', 'sports', 'concert'], category: 'travel' },
  { emoji: '⛺', name: 'Tent', shortcode: ':tent:', keywords: ['camping', 'tent', 'camp', 'outdoors', 'nature'], category: 'travel' },

  // 💡 OBJECTS & TOOLS
  { emoji: '💡', name: 'Light Bulb', shortcode: ':bulb:', keywords: ['bulb', 'light', 'idea', 'bright', 'smart', 'genius'], category: 'objects' },
  { emoji: '🔦', name: 'Flashlight', shortcode: ':flashlight:', keywords: ['flashlight', 'light', 'torch', 'beam'], category: 'objects' },
  { emoji: '📱', name: 'Mobile Phone', shortcode: ':iphone:', keywords: ['phone', 'mobile', 'smartphone', 'iphone'], category: 'objects' },
  { emoji: '💰', name: 'Money Bag', shortcode: ':moneybag:', keywords: ['money', 'cash', 'dollar', 'rich', 'bag'], category: 'objects' },
  { emoji: '🪙', name: 'Coin', shortcode: ':coin:', keywords: ['coin', 'gold', 'crypto', 'token', 'currency'], category: 'objects' },
  { emoji: '🔑', name: 'Key', shortcode: ':key:', keywords: ['key', 'password', 'access', 'secret', 'unlock'], category: 'objects' },
  { emoji: '🔒', name: 'Locked', shortcode: ':lock:', keywords: ['lock', 'locked', 'secure', 'private', 'safety'], category: 'objects' },
  { emoji: '🔓', name: 'Unlocked', shortcode: ':unlock:', keywords: ['unlock', 'unlocked', 'open', 'access'], category: 'objects' },
  { emoji: '💣', name: 'Bomb', shortcode: ':bomb:', keywords: ['bomb', 'explode', 'boom', 'blast', 'danger'], category: 'objects' },
  { emoji: '🧨', name: 'Firecracker', shortcode: ':firecracker:', keywords: ['firecracker', 'dynamite', 'tnt', 'boom'], category: 'objects' },
  { emoji: '🗡️', name: 'Dagger', shortcode: ':dagger:', keywords: ['dagger', 'knife', 'blade', 'weapon', 'assassin'], category: 'objects' },
  { emoji: '📦', name: 'Package', shortcode: ':package:', keywords: ['package', 'box', 'delivery', 'parcel'], category: 'objects' },
  { emoji: '🎁', name: 'Wrapped Gift', shortcode: ':gift:', keywords: ['gift', 'present', 'birthday', 'giveaway', 'surprise'], category: 'objects' },
  { emoji: '🎉', name: 'Party Popper', shortcode: ':tada:', keywords: ['party', 'tada', 'celebrate', 'congrats', 'popper'], category: 'objects' },

  // ❤️ SYMBOLS & HEARTS
  { emoji: '❤️', name: 'Red Heart', shortcode: ':heart:', keywords: ['heart', 'love', 'red', 'like', 'affection'], category: 'symbols' },
  { emoji: '💔', name: 'Broken Heart', shortcode: ':broken_heart:', keywords: ['broken heart', 'sad', 'heartbreak', 'pain'], category: 'symbols' },
  { emoji: '💖', name: 'Sparkling Heart', shortcode: ':sparkling_heart:', keywords: ['sparkle heart', 'love', 'cute', 'shine'], category: 'symbols' },
  { emoji: '⭐', name: 'Star', shortcode: ':star:', keywords: ['star', 'yellow', 'favorite', 'rating'], category: 'symbols' },
  { emoji: '✨', name: 'Sparkles', shortcode: ':sparkles:', keywords: ['sparkles', 'magic', 'shine', 'special', 'clean', 'boost'], category: 'symbols' },
  { emoji: '⚠️', name: 'Warning', shortcode: ':warning:', keywords: ['warning', 'alert', 'caution', 'danger', 'notice'], category: 'symbols' },
  { emoji: '⛔', name: 'No Entry', shortcode: ':no_entry:', keywords: ['no entry', 'stop', 'prohibited', 'denied'], category: 'symbols' },
  { emoji: '🚫', name: 'Prohibited', shortcode: ':prohibited:', keywords: ['prohibited', 'banned', 'no', 'forbidden'], category: 'symbols' },
  { emoji: '✅', name: 'Check Mark Button', shortcode: ':white_check_mark:', keywords: ['check', 'verified', 'done', 'yes', 'correct', 'ok', 'true'], category: 'symbols' },
  { emoji: '❌', name: 'Cross Mark', shortcode: ':x:', keywords: ['cross', 'x', 'no', 'wrong', 'cancel', 'delete', 'false'], category: 'symbols' },
  { emoji: '❗', name: 'Red Exclamation Mark', shortcode: ':exclamation:', keywords: ['exclamation', 'alert', 'important', 'notice', 'attention'], category: 'symbols' },
  { emoji: '❓', name: 'Question Mark', shortcode: ':question:', keywords: ['question', 'help', 'what', 'doubt', 'why'], category: 'symbols' },
  { emoji: '💤', name: 'Zzz', shortcode: ':zzz:', keywords: ['zzz', 'sleep', 'afk', 'inactive', 'tired'], category: 'symbols' },
  { emoji: '🏁', name: 'Chequered Flag', shortcode: ':checkered_flag:', keywords: ['flag', 'finish', 'racing', 'race', 'winner'], category: 'symbols' }
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Sparkles },
  { id: 'custom', name: 'Server', icon: Smile },
  { id: 'smileys', name: 'Smileys', icon: Smile },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
  { id: 'people', name: 'People', icon: User },
  { id: 'nature', name: 'Nature', icon: Trees },
  { id: 'food', name: 'Food', icon: Utensils },
  { id: 'travel', name: 'Travel', icon: Plane },
  { id: 'objects', name: 'Objects', icon: Wrench },
  { id: 'symbols', name: 'Symbols', icon: Heart }
] as const;

interface DiscordEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  onClear?: () => void;
  currentEmoji?: string;
  slotIndex?: number;
}

export function DiscordEmojiPicker({
  onSelect,
  onClose,
  onClear,
  currentEmoji,
  slotIndex = 0
}: DiscordEmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiItem | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Smart Search Ranking
  const filteredEmojis = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    let baseList = EMOJI_DATABASE;
    if (activeCategory !== 'all' && !q) {
      baseList = EMOJI_DATABASE.filter((e) => e.category === activeCategory);
    }

    if (!q) return baseList;

    const scored: { item: EmojiItem; score: number }[] = [];

    for (const item of EMOJI_DATABASE) {
      let score = 0;
      const nameLower = item.name.toLowerCase();
      const codeLower = item.shortcode.toLowerCase();

      // 1. Exact match on shortcode / name (Score 1000)
      if (codeLower === `:${q}:` || nameLower === q) {
        score += 1000;
      }
      // 2. Exact match in keywords (Score 800) -> e.g. "fire" matches 🔥 directly
      else if (item.keywords.some((k) => k.toLowerCase() === q)) {
        score += 800;
      }
      // 3. Prefix match on name or shortcode (Score 500)
      else if (nameLower.startsWith(q) || codeLower.startsWith(`:${q}`)) {
        score += 500;
      }
      // 4. Prefix match on any keyword (Score 350)
      else if (item.keywords.some((k) => k.toLowerCase().startsWith(q))) {
        score += 350;
      }
      // 5. Contains match on name or keywords (Score 100)
      else if (nameLower.includes(q) || item.keywords.some((k) => k.toLowerCase().includes(q))) {
        score += 100;
      }

      if (score > 0) {
        scored.push({ item, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.item);
  }, [search, activeCategory]);

  return (
    <div className="w-[330px] sm:w-[350px] bg-[#111214] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(225,29,46,0.25)] flex flex-col overflow-hidden text-white select-none backdrop-blur-xl">
      {/* Search Header */}
      <div className="p-3 pb-2 border-b border-white/5 flex flex-col gap-2.5">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search emojis (e.g. fire, sword, crown)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value) setActiveCategory('all');
            }}
            className="w-full pl-8 pr-7 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-red-500/50 transition-colors"
          />
          <Search size={13} className="absolute left-2.5 top-3 text-zinc-400" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        {!search && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(225,29,46,0.4)]'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={cat.name}
                >
                  <Icon size={12} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Emoji Grid Area */}
      <div className="p-2 max-h-60 overflow-y-auto min-h-[180px] custom-scrollbar">
        {filteredEmojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-1">
            <span className="text-2xl">🔍</span>
            <span className="text-xs font-semibold text-zinc-400">No matching emojis</span>
            <span className="text-[10.5px] text-zinc-600">Try searching for &quot;fire&quot;, &quot;sword&quot;, or &quot;crown&quot;</span>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((item, idx) => (
              <button
                key={`${item.shortcode}-${idx}`}
                type="button"
                onMouseEnter={() => setHoveredEmoji(item)}
                onClick={() => {
                  onSelect(item.emoji);
                  onClose();
                }}
                className={`w-9 h-9 rounded-xl hover:bg-red-500/20 hover:scale-125 flex items-center justify-center text-lg transition-all active:scale-95 ${
                  currentEmoji === item.emoji
                    ? 'bg-red-500/30 border border-red-500/50 shadow-[0_0_12px_rgba(225,29,46,0.4)]'
                    : 'bg-white/[0.02]'
                }`}
                title={item.name}
              >
                <span className="leading-none">{item.emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Preview / Status */}
      <div className="flex items-center justify-between p-2.5 px-3 bg-[#0c0d0e] border-t border-white/5 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          {hoveredEmoji ? (
            <>
              <span className="text-lg leading-none">{hoveredEmoji.emoji}</span>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[11px] font-bold text-white truncate">{hoveredEmoji.name}</span>
                <span className="text-[9.5px] font-mono text-zinc-400 truncate">{hoveredEmoji.shortcode}</span>
              </div>
            </>
          ) : (
            <span className="text-[11px] text-zinc-500 font-mono">
              Trait Slot {slotIndex + 1}
            </span>
          )}
        </div>

        {currentEmoji && onClear && (
          <button
            type="button"
            onClick={() => {
              onClear();
              onClose();
            }}
            className="text-red-400 hover:text-red-300 text-[11px] font-semibold transition-colors shrink-0 ml-2"
          >
            Remove Emoji
          </button>
        )}
      </div>
    </div>
  );
}
