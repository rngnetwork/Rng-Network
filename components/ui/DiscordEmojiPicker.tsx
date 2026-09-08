"use client";

import React, { useState, useMemo, useRef, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Sparkles, Smile, Gamepad2, User, Trees, Utensils, Plane, Wrench, Heart } from 'lucide-react';

export interface EmojiItem {
  emoji: string;
  name: string;
  shortcode: string;
  keywords: string[];
  category: 'custom' | 'smileys' | 'gaming' | 'people' | 'nature' | 'food' | 'travel' | 'objects' | 'symbols';
}

export const EMOJI_DATABASE: EmojiItem[] = [
  // ==========================================
  // 👑 CUSTOM SERVER EMOJIS (32 Emojis)
  // ==========================================
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
  { emoji: '🔴', name: 'Red Circle', shortcode: ':red_circle:', keywords: ['red', 'circle', 'dot', 'rng', 'badge'], category: 'custom' },
  { emoji: '✨', name: 'Sparkles', shortcode: ':sparkles:', keywords: ['sparkle', 'magic', 'shine', 'glow', 'special'], category: 'custom' },
  { emoji: '🗡️', name: 'Dagger', shortcode: ':dagger:', keywords: ['dagger', 'knife', 'assassin', 'weapon', 'blade'], category: 'custom' },
  { emoji: '🧿', name: 'Nazar Amulet', shortcode: ':nazar_amulet:', keywords: ['evil eye', 'amulet', 'protection', 'charm'], category: 'custom' },
  { emoji: '🪐', name: 'Ringed Planet', shortcode: ':ringed_planet:', keywords: ['planet', 'saturn', 'space', 'cosmos'], category: 'custom' },
  { emoji: '💥', name: 'Collision', shortcode: ':boom:', keywords: ['boom', 'collision', 'blast', 'bang', 'impact'], category: 'custom' },
  { emoji: '🧨', name: 'Firecracker', shortcode: ':firecracker:', keywords: ['tnt', 'dynamite', 'explosive', 'firecracker'], category: 'custom' },
  { emoji: '🔱', name: 'Trident Emblem', shortcode: ':trident:', keywords: ['trident', 'poseidon', 'fork', 'ocean'], category: 'custom' },
  { emoji: '☢️', name: 'Radioactive', shortcode: ':radioactive:', keywords: ['nuclear', 'radioactive', 'hazard', 'toxic'], category: 'custom' },
  { emoji: '☣️', name: 'Biohazard', shortcode: ':biohazard:', keywords: ['biohazard', 'virus', 'danger', 'toxic'], category: 'custom' },

  // ==========================================
  // 😀 SMILEYS & EMOTIONS (115 Emojis)
  // ==========================================
  { emoji: '😀', name: 'Grinning Face', shortcode: ':grinning:', keywords: ['smile', 'happy', 'grin', 'joy'], category: 'smileys' },
  { emoji: '😃', name: 'Grinning Face with Big Eyes', shortcode: ':smiley:', keywords: ['happy', 'joy', 'smile', 'excited'], category: 'smileys' },
  { emoji: '😄', name: 'Grinning Face with Smiling Eyes', shortcode: ':smile:', keywords: ['happy', 'laugh', 'joy', 'smile'], category: 'smileys' },
  { emoji: '😁', name: 'Beaming Face with Smiling Eyes', shortcode: ':grin:', keywords: ['teeth', 'happy', 'grin', 'cheerful'], category: 'smileys' },
  { emoji: '😆', name: 'Grinning Squinting Face', shortcode: ':laughing:', keywords: ['laugh', 'happy', 'haha', 'lmao', 'xd'], category: 'smileys' },
  { emoji: '😅', name: 'Grinning Face with Sweat', shortcode: ':sweat_smile:', keywords: ['nervous', 'phew', 'relief', 'sweat', 'whew'], category: 'smileys' },
  { emoji: '🤣', name: 'Rolling on the Floor Laughing', shortcode: ':rofl:', keywords: ['rofl', 'laugh', 'funny', 'hilarious', 'lmao'], category: 'smileys' },
  { emoji: '😂', name: 'Face with Tears of Joy', shortcode: ':joy:', keywords: ['joy', 'tears', 'crying laughing', 'lol', 'funny'], category: 'smileys' },
  { emoji: '🙂', name: 'Slightly Smiling Face', shortcode: ':slight_smile:', keywords: ['smile', 'calm', 'fine', 'pleasant'], category: 'smileys' },
  { emoji: '🙃', name: 'Upside-Down Face', shortcode: ':upside_down_face:', keywords: ['silly', 'sarcastic', 'ironic', 'upside down'], category: 'smileys' },
  { emoji: '😉', name: 'Winking Face', shortcode: ':wink:', keywords: ['wink', 'playful', 'joke', 'flirt'], category: 'smileys' },
  { emoji: '😊', name: 'Smiling Face with Smiling Eyes', shortcode: ':blush:', keywords: ['blush', 'sweet', 'happy', 'warm', 'friendly'], category: 'smileys' },
  { emoji: '😇', name: 'Smiling Face with Halo', shortcode: ':innocent:', keywords: ['angel', 'halo', 'pure', 'good', 'innocent'], category: 'smileys' },
  { emoji: '🥰', name: 'Smiling Face with Hearts', shortcode: ':smiling_face_with_3_hearts:', keywords: ['love', 'adore', 'hearts', 'affection', 'crush'], category: 'smileys' },
  { emoji: '😍', name: 'Heart Eyes Face', shortcode: ':heart_eyes:', keywords: ['love', 'infatuation', 'heart', 'crush', 'gorgeous'], category: 'smileys' },
  { emoji: '🤩', name: 'Star-Struck', shortcode: ':star_struck:', keywords: ['star', 'excited', 'amazed', 'wow', 'fascinated'], category: 'smileys' },
  { emoji: '😘', name: 'Face Blowing a Kiss', shortcode: ':kissing_heart:', keywords: ['kiss', 'love', 'flirt', 'smooch'], category: 'smileys' },
  { emoji: '😗', name: 'Kissing Face', shortcode: ':kissing:', keywords: ['kiss', 'whistle', 'lips'], category: 'smileys' },
  { emoji: '😚', name: 'Kissing Face with Closed Eyes', shortcode: ':kissing_closed_eyes:', keywords: ['kiss', 'sweet', 'eyes closed'], category: 'smileys' },
  { emoji: '😋', name: 'Face Savoring Food', shortcode: ':yum:', keywords: ['yum', 'delicious', 'tasty', 'food', 'tongue'], category: 'smileys' },
  { emoji: '😛', name: 'Face with Tongue', shortcode: ':stuck_out_tongue:', keywords: ['tongue', 'playful', 'silly'], category: 'smileys' },
  { emoji: '😜', name: 'Winking Face with Tongue', shortcode: ':stuck_out_tongue_winking_eye:', keywords: ['tongue', 'wink', 'crazy', 'joke', 'silly'], category: 'smileys' },
  { emoji: '🤪', name: 'Zany Face', shortcode: ':zany_face:', keywords: ['crazy', 'wild', 'party', 'funny', 'goofy'], category: 'smileys' },
  { emoji: '😝', name: 'Squinting Face with Tongue', shortcode: ':stuck_out_tongue_closed_eyes:', keywords: ['tongue', 'crazy', 'joke', 'haha'], category: 'smileys' },
  { emoji: '🤑', name: 'Money-Mouth Face', shortcode: ':money_mouth:', keywords: ['money', 'rich', 'dollar', 'cash', 'wealth'], category: 'smileys' },
  { emoji: '🤗', name: 'Hugging Face', shortcode: ':hugging:', keywords: ['hug', 'welcome', 'warm', 'friendly'], category: 'smileys' },
  { emoji: '🤭', name: 'Face with Hand Over Mouth', shortcode: ':hand_over_mouth:', keywords: ['giggle', 'oops', 'secret', 'teehee'], category: 'smileys' },
  { emoji: '🤫', name: 'Shushing Face', shortcode: ':shushing_face:', keywords: ['shh', 'quiet', 'secret', 'silence', 'hush'], category: 'smileys' },
  { emoji: '🤔', name: 'Thinking Face', shortcode: ':thinking:', keywords: ['think', 'ponder', 'hmm', 'curious', 'question'], category: 'smileys' },
  { emoji: '🤐', name: 'Zipper-Mouth Face', shortcode: ':zipper_mouth:', keywords: ['zipper', 'silent', 'secret', 'mute', 'quiet'], category: 'smileys' },
  { emoji: '🤨', name: 'Face with Raised Eyebrow', shortcode: ':raised_eyebrow:', keywords: ['suspicious', 'doubt', 'skeptical', 'really'], category: 'smileys' },
  { emoji: '😐', name: 'Neutral Face', shortcode: ':neutral_face:', keywords: ['neutral', 'meh', 'pokerface', 'blank'], category: 'smileys' },
  { emoji: '😑', name: 'Expressionless Face', shortcode: ':expressionless:', keywords: ['expressionless', 'unimpressed', 'flat'], category: 'smileys' },
  { emoji: '😶', name: 'Face Without Mouth', shortcode: ':no_mouth:', keywords: ['silent', 'mute', 'blank', 'no mouth'], category: 'smileys' },
  { emoji: '😏', name: 'Smirking Face', shortcode: ':smirk:', keywords: ['smirk', 'smug', 'sly', 'flirt'], category: 'smileys' },
  { emoji: '😒', name: 'Unamused Face', shortcode: ':unamused:', keywords: ['unamused', 'annoyed', 'boring', 'unimpressed'], category: 'smileys' },
  { emoji: '🙄', name: 'Face with Rolling Eyes', shortcode: ':roll_eyes:', keywords: ['eyeroll', 'frustrated', 'whatever', 'bored'], category: 'smileys' },
  { emoji: '😬', name: 'Grimacing Face', shortcode: ':grimacing:', keywords: ['grimace', 'awkward', 'cringe', 'ouch', 'nervous'], category: 'smileys' },
  { emoji: '🤥', name: 'Lying Face', shortcode: ':lying_face:', keywords: ['pinocchio', 'lie', 'liar'], category: 'smileys' },
  { emoji: '😌', name: 'Relieved Face', shortcode: ':relieved:', keywords: ['relieved', 'calm', 'peaceful', 'relaxed'], category: 'smileys' },
  { emoji: '😔', name: 'Pensive Face', shortcode: ':pensive:', keywords: ['sad', 'pensive', 'down', 'gloomy'], category: 'smileys' },
  { emoji: '😪', name: 'Sleepy Face', shortcode: ':sleepy:', keywords: ['sleepy', 'tired', 'bubble'], category: 'smileys' },
  { emoji: '🤤', name: 'Drooling Face', shortcode: ':drooling_face:', keywords: ['drool', 'delicious', 'sleepy'], category: 'smileys' },
  { emoji: '😴', name: 'Sleeping Face', shortcode: ':sleeping:', keywords: ['sleep', 'tired', 'zzz', 'night', 'bed'], category: 'smileys' },
  { emoji: '😷', name: 'Face with Medical Mask', shortcode: ':mask:', keywords: ['mask', 'sick', 'virus', 'doctor'], category: 'smileys' },
  { emoji: '🤒', name: 'Face with Thermometer', shortcode: ':face_with_thermometer:', keywords: ['fever', 'sick', 'ill'], category: 'smileys' },
  { emoji: '🤕', name: 'Face with Head-Bandage', shortcode: ':face_with_head_bandage:', keywords: ['hurt', 'bandage', 'injury'], category: 'smileys' },
  { emoji: '🤢', name: 'Nauseated Face', shortcode: ':nauseated_face:', keywords: ['gross', 'sick', 'vomit', 'green'], category: 'smileys' },
  { emoji: '🤮', name: 'Face Vomiting', shortcode: ':vomiting_face:', keywords: ['barf', 'vomit', 'puke', 'sick'], category: 'smileys' },
  { emoji: '🤧', name: 'Sneezing Face', shortcode: ':sneezing_face:', keywords: ['sneeze', 'tissue', 'sick'], category: 'smileys' },
  { emoji: '🥵', name: 'Hot Face', shortcode: ':hot_face:', keywords: ['hot', 'heat', 'summer', 'sweat', 'warm'], category: 'smileys' },
  { emoji: '🥶', name: 'Cold Face', shortcode: ':cold_face:', keywords: ['cold', 'freezing', 'winter', 'ice', 'frost'], category: 'smileys' },
  { emoji: '🥴', name: 'Woozy Face', shortcode: ':woozy_face:', keywords: ['dizzy', 'drunk', 'woozy', 'high'], category: 'smileys' },
  { emoji: '😵', name: 'Dizzy Face', shortcode: ':dizzy_face:', keywords: ['dizzy', 'dead', 'shocked'], category: 'smileys' },
  { emoji: '🤯', name: 'Exploding Head', shortcode: ':exploding_head:', keywords: ['mindblown', 'shocked', 'boom', 'explode', 'insane'], category: 'smileys' },
  { emoji: '🤠', name: 'Cowboy Hat Face', shortcode: ':cowboy_hat_face:', keywords: ['cowboy', 'western', 'yeehaw'], category: 'smileys' },
  { emoji: '🥳', name: 'Partying Face', shortcode: ':partying_face:', keywords: ['party', 'celebrate', 'birthday', 'horn', 'cheers'], category: 'smileys' },
  { emoji: '😎', name: 'Smiling Face with Sunglasses', shortcode: ':sunglasses:', keywords: ['cool', 'sunglasses', 'boss', 'chill', 'slick'], category: 'smileys' },
  { emoji: '🤓', name: 'Nerd Face', shortcode: ':nerd:', keywords: ['nerd', 'geek', 'smart', 'glasses', 'study'], category: 'smileys' },
  { emoji: '🧐', name: 'Face with Monocle', shortcode: ':monocle:', keywords: ['monocle', 'classy', 'investigate', 'curious', 'formal'], category: 'smileys' },
  { emoji: '😕', name: 'Confused Face', shortcode: ':confused:', keywords: ['confused', 'lost', 'puzzled', 'uncertain'], category: 'smileys' },
  { emoji: '😟', name: 'Worried Face', shortcode: ':worried:', keywords: ['worried', 'nervous', 'scared'], category: 'smileys' },
  { emoji: '🙁', name: 'Slightly Frowning Face', shortcode: ':slightly_frowning_face:', keywords: ['frown', 'sad', 'disappointed'], category: 'smileys' },
  { emoji: '😮', name: 'Face with Open Mouth', shortcode: ':open_mouth:', keywords: ['surprise', 'wow', 'gasp', 'omg'], category: 'smileys' },
  { emoji: '😯', name: 'Hushed Face', shortcode: ':hushed:', keywords: ['hushed', 'silent', 'stunned'], category: 'smileys' },
  { emoji: '😲', name: 'Astonished Face', shortcode: ':astonished:', keywords: ['shocked', 'astonished', 'amazed', 'omg'], category: 'smileys' },
  { emoji: '😳', name: 'Flushed Face', shortcode: ':flushed:', keywords: ['flushed', 'blush', 'embarrassed', 'shock'], category: 'smileys' },
  { emoji: '🥺', name: 'Pleading Face', shortcode: ':pleading_face:', keywords: ['pleading', 'begging', 'puppy', 'please', 'cute', 'eyes'], category: 'smileys' },
  { emoji: '😦', name: 'Frowning Face with Open Mouth', shortcode: ':frowning:', keywords: ['frown', 'sad', 'shock'], category: 'smileys' },
  { emoji: '😧', name: 'Anguished Face', shortcode: ':anguished:', keywords: ['anguish', 'shock', 'pain'], category: 'smileys' },
  { emoji: '😨', name: 'Fearful Face', shortcode: ':fearful:', keywords: ['fear', 'scared', 'afraid'], category: 'smileys' },
  { emoji: '😰', name: 'Anxious Face with Sweat', shortcode: ':cold_sweat:', keywords: ['anxious', 'sweat', 'nervous'], category: 'smileys' },
  { emoji: '😥', name: 'Sad but Relieved Face', shortcode: ':disappointed_relieved:', keywords: ['phew', 'relieved', 'close call'], category: 'smileys' },
  { emoji: '😢', name: 'Crying Face', shortcode: ':cry:', keywords: ['cry', 'tears', 'sad'], category: 'smileys' },
  { emoji: '😭', name: 'Loudly Crying Face', shortcode: ':sob:', keywords: ['crying', 'sob', 'tears', 'sad', 'pain'], category: 'smileys' },
  { emoji: '😱', name: 'Face Screaming in Fear', shortcode: ':scream:', keywords: ['scream', 'fear', 'scared', 'shock', 'omg'], category: 'smileys' },
  { emoji: '😖', name: 'Confounded Face', shortcode: ':confounded:', keywords: ['confounded', 'upset', 'struggle'], category: 'smileys' },
  { emoji: '😣', name: 'Persevering Face', shortcode: ':persevere:', keywords: ['persevere', 'struggle', 'try hard'], category: 'smileys' },
  { emoji: '😞', name: 'Disappointed Face', shortcode: ':disappointed:', keywords: ['disappointed', 'sad', 'regret'], category: 'smileys' },
  { emoji: '😓', name: 'Downcast Face with Sweat', shortcode: ':sweat:', keywords: ['sweat', 'tired', 'exhausted'], category: 'smileys' },
  { emoji: '😩', name: 'Weary Face', shortcode: ':weary:', keywords: ['weary', 'tired', 'frustrated'], category: 'smileys' },
  { emoji: '😫', name: 'Tired Face', shortcode: ':tired_face:', keywords: ['tired', 'done', 'exhausted'], category: 'smileys' },
  { emoji: '🥱', name: 'Yawning Face', shortcode: ':yawning_face:', keywords: ['yawn', 'sleepy', 'bored'], category: 'smileys' },
  { emoji: '😤', name: 'Face with Steam From Nose', shortcode: ':triumph:', keywords: ['triumph', 'pride', 'steam', 'anger', 'determined'], category: 'smileys' },
  { emoji: '😡', name: 'Pouting Face', shortcode: ':rage:', keywords: ['rage', 'angry', 'mad', 'furious'], category: 'smileys' },
  { emoji: '😠', name: 'Angry Face', shortcode: ':angry:', keywords: ['angry', 'mad', 'grumpy'], category: 'smileys' },
  { emoji: '🤬', name: 'Face with Symbols on Mouth', shortcode: ':cursing_face:', keywords: ['curse', 'swear', 'rage', 'furious'], category: 'smileys' },
  { emoji: '😈', name: 'Smiling Face with Horns', shortcode: ':smiling_imp:', keywords: ['devil', 'horns', 'evil', 'naughty'], category: 'smileys' },
  { emoji: '👿', name: 'Angry Face with Horns', shortcode: ':imp:', keywords: ['devil', 'demon', 'angry', 'horns'], category: 'smileys' },
  { emoji: '🤡', name: 'Clown Face', shortcode: ':clown:', keywords: ['clown', 'joke', 'fool', 'circus', 'funny'], category: 'smileys' },
  { emoji: '💩', name: 'Pile of Poo', shortcode: ':poop:', keywords: ['poo', 'poop', 'crap', 'turd'], category: 'smileys' },
  { emoji: '👻', name: 'Ghost', shortcode: ':ghost:', keywords: ['ghost', 'spooky', 'halloween', 'boo', 'spirit'], category: 'smileys' },
  { emoji: '💀', name: 'Skull', shortcode: ':skull:', keywords: ['skull', 'dead', 'danger', 'death'], category: 'smileys' },
  { emoji: '☠️', name: 'Skull and Crossbones', shortcode: ':skull_crossbones:', keywords: ['pirate', 'poison', 'danger', 'dead'], category: 'smileys' },
  { emoji: '👽', name: 'Alien', shortcode: ':alien:', keywords: ['alien', 'extraterrestrial', 'ufo', 'space'], category: 'smileys' },
  { emoji: '👾', name: 'Alien Monster', shortcode: ':space_invader:', keywords: ['alien', 'arcade', 'retro', 'gaming'], category: 'smileys' },
  { emoji: '🤖', name: 'Robot', shortcode: ':robot:', keywords: ['robot', 'bot', 'ai', 'tech'], category: 'smileys' },
  { emoji: '🎃', name: 'Jack-o-Lantern', shortcode: ':jack_o_lantern:', keywords: ['pumpkin', 'halloween', 'autumn'], category: 'smileys' },
  { emoji: '😺', name: 'Grinning Cat', shortcode: ':grinning_cat:', keywords: ['cat', 'smile', 'kitty'], category: 'smileys' },
  { emoji: '😸', name: 'Grinning Cat with Smiling Eyes', shortcode: ':smile_cat:', keywords: ['cat', 'happy', 'laugh'], category: 'smileys' },
  { emoji: '😹', name: 'Cat with Tears of Joy', shortcode: ':joy_cat:', keywords: ['cat', 'joy', 'lol'], category: 'smileys' },
  { emoji: '😻', name: 'Smiling Cat with Heart-Eyes', shortcode: ':heart_eyes_cat:', keywords: ['cat', 'love', 'crush'], category: 'smileys' },
  { emoji: '😼', name: 'Cat with Wry Smile', shortcode: ':smirk_cat:', keywords: ['cat', 'smirk', 'wry'], category: 'smileys' },
  { emoji: '😽', name: 'Kissing Cat', shortcode: ':kissing_cat:', keywords: ['cat', 'kiss', 'flirt'], category: 'smileys' },
  { emoji: '🙀', name: 'Weary Cat', shortcode: ':scream_cat:', keywords: ['cat', 'shocked', 'omg'], category: 'smileys' },
  { emoji: '😿', name: 'Crying Cat', shortcode: ':crying_cat_face:', keywords: ['cat', 'sad', 'cry'], category: 'smileys' },
  { emoji: '😾', name: 'Pouting Cat', shortcode: ':pouting_cat:', keywords: ['cat', 'angry', 'grumpy'], category: 'smileys' },

  // ==========================================
  // 🎮 GAMING & ACTIVITIES (85 Emojis)
  // ==========================================
  { emoji: '🎮', name: 'Video Game', shortcode: ':video_game:', keywords: ['game', 'gaming', 'gamer', 'controller', 'play', 'console'], category: 'gaming' },
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
  { emoji: '🛼', name: 'Roller Skate', shortcode: ':roller_skate:', keywords: ['roller skate', 'skate', 'retro'], category: 'gaming' },
  { emoji: '⚽', name: 'Soccer Ball', shortcode: ':soccer:', keywords: ['soccer', 'football', 'fifa', 'ball', 'sport'], category: 'gaming' },
  { emoji: '🏀', name: 'Basketball', shortcode: ':basketball:', keywords: ['basketball', 'nba', 'hoop', 'ball', 'sport'], category: 'gaming' },
  { emoji: '🏈', name: 'American Football', shortcode: ':football:', keywords: ['football', 'nfl', 'touchdown', 'ball'], category: 'gaming' },
  { emoji: '⚾', name: 'Baseball', shortcode: ':baseball:', keywords: ['baseball', 'bat', 'mlb', 'ball'], category: 'gaming' },
  { emoji: '🥎', name: 'Softball', shortcode: ':softball:', keywords: ['softball', 'ball'], category: 'gaming' },
  { emoji: '🎾', name: 'Tennis', shortcode: ':tennis:', keywords: ['tennis', 'racket', 'court', 'match'], category: 'gaming' },
  { emoji: '🏐', name: 'Volleyball', shortcode: ':volleyball:', keywords: ['volleyball', 'ball', 'beach'], category: 'gaming' },
  { emoji: '🏉', name: 'Rugby Football', shortcode: ':rugby_football:', keywords: ['rugby', 'scrum'], category: 'gaming' },
  { emoji: '🥏', name: 'Flying Disc', shortcode: ':flying_disc:', keywords: ['frisbee', 'disc'], category: 'gaming' },
  { emoji: '🎱', name: 'Pool 8 Ball', shortcode: ':8ball:', keywords: ['8ball', 'billiards', 'pool', 'eightball'], category: 'gaming' },
  { emoji: '🏓', name: 'Ping Pong', shortcode: ':ping_pong:', keywords: ['ping pong', 'table tennis', 'paddle'], category: 'gaming' },
  { emoji: '🏸', name: 'Badminton', shortcode: ':badminton:', keywords: ['badminton', 'shuttlecock', 'racket'], category: 'gaming' },
  { emoji: '🏒', name: 'Ice Hockey', shortcode: ':ice_hockey:', keywords: ['hockey', 'puck', 'nhl'], category: 'gaming' },
  { emoji: '🏑', name: 'Field Hockey', shortcode: ':field_hockey:', keywords: ['field hockey', 'stick'], category: 'gaming' },
  { emoji: '🏏', name: 'Cricket Game', shortcode: ':cricket:', keywords: ['cricket', 'bat', 'ball'], category: 'gaming' },
  { emoji: '⛳', name: 'Flag in Hole', shortcode: ':golf:', keywords: ['golf', 'hole', 'course'], category: 'gaming' },
  { emoji: '🎣', name: 'Fishing Pole', shortcode: ':fishing_pole_and_fish:', keywords: ['fish', 'fishing', 'hook'], category: 'gaming' },
  { emoji: '🎽', name: 'Running Shirt', shortcode: ':running_shirt_with_sash:', keywords: ['marathon', 'running', 'sport'], category: 'gaming' },
  { emoji: '🎿', name: 'Skis', shortcode: ':ski:', keywords: ['ski', 'snow', 'winter'], category: 'gaming' },
  { emoji: '🛷', name: 'Sled', shortcode: ':sled:', keywords: ['sled', 'sledge', 'snow'], category: 'gaming' },
  { emoji: '🥌', name: 'Curling Stone', shortcode: ':curling_stone:', keywords: ['curling', 'ice'], category: 'gaming' },
  { emoji: '🏆', name: 'Trophy', shortcode: ':trophy:', keywords: ['trophy', 'champion', 'first', 'winner', 'cup'], category: 'gaming' },
  { emoji: '🥇', name: '1st Place Medal', shortcode: ':first_place:', keywords: ['gold', 'winner', 'first', 'champion', 'medal'], category: 'gaming' },
  { emoji: '🥈', name: '2nd Place Medal', shortcode: ':second_place:', keywords: ['silver', 'second', 'medal'], category: 'gaming' },
  { emoji: '🥉', name: '3rd Place Medal', shortcode: ':third_place:', keywords: ['bronze', 'third', 'medal'], category: 'gaming' },
  { emoji: '🏅', name: 'Sports Medal', shortcode: ':medal_sports:', keywords: ['medal', 'sports', 'award'], category: 'gaming' },
  { emoji: '🎪', name: 'Circus Tent', shortcode: ':circus_tent:', keywords: ['circus', 'carnival', 'festival', 'event'], category: 'gaming' },
  { emoji: '🎟️', name: 'Admission Tickets', shortcode: ':tickets:', keywords: ['ticket', 'event', 'pass', 'vip', 'admission'], category: 'gaming' },
  { emoji: '🎫', name: 'Ticket', shortcode: ':ticket:', keywords: ['ticket', 'entry', 'cinema'], category: 'gaming' },
  { emoji: '🎼', name: 'Musical Score', shortcode: ':musical_score:', keywords: ['music', 'notes', 'song'], category: 'gaming' },
  { emoji: '🎹', name: 'Musical Keyboard', shortcode: ':musical_keyboard:', keywords: ['piano', 'keyboard', 'music'], category: 'gaming' },
  { emoji: '🥁', name: 'Drum', shortcode: ':drum:', keywords: ['drum', 'beat', 'music'], category: 'gaming' },
  { emoji: '🎷', name: 'Saxophone', shortcode: ':saxophone:', keywords: ['sax', 'jazz', 'music'], category: 'gaming' },
  { emoji: '🎺', name: 'Trumpet', shortcode: ':trumpet:', keywords: ['trumpet', 'brass', 'music'], category: 'gaming' },
  { emoji: '🎸', name: 'Guitar', shortcode: ':guitar:', keywords: ['guitar', 'rock', 'music', 'acoustic'], category: 'gaming' },
  { emoji: '🎻', name: 'Violin', shortcode: ':violin:', keywords: ['violin', 'classical', 'music'], category: 'gaming' },

  // ==========================================
  // 👋 PEOPLE & GESTURES (95 Emojis)
  // ==========================================
  { emoji: '👋', name: 'Waving Hand', shortcode: ':wave:', keywords: ['wave', 'hello', 'hi', 'bye', 'welcome'], category: 'people' },
  { emoji: '🤚', name: 'Raised Back of Hand', shortcode: ':raised_back_of_hand:', keywords: ['backhand', 'raised hand'], category: 'people' },
  { emoji: '🖐️', name: 'Hand with Fingers Splayed', shortcode: ':raised_hand_with_fingers_splayed:', keywords: ['five', 'hand', 'splayed'], category: 'people' },
  { emoji: '✋', name: 'Raised Hand', shortcode: ':raised_hand:', keywords: ['stop', 'high five', 'palm'], category: 'people' },
  { emoji: '🖖', name: 'Vulcan Salute', shortcode: ':vulcan_salute:', keywords: ['spock', 'star trek', 'vulcan'], category: 'people' },
  { emoji: '👌', name: 'OK Hand', shortcode: ':ok_hand:', keywords: ['ok', 'perfect', 'fine', 'agree'], category: 'people' },
  { emoji: '🤌', name: 'Pinched Fingers', shortcode: ':pinched_fingers:', keywords: ['italian', 'what do you want', 'gesture'], category: 'people' },
  { emoji: '🤏', name: 'Pinching Hand', shortcode: ':pinching_hand:', keywords: ['small', 'little', 'pinch'], category: 'people' },
  { emoji: '✌️', name: 'Victory Hand', shortcode: ':v:', keywords: ['peace', 'victory', 'two', 'peace out'], category: 'people' },
  { emoji: '🤞', name: 'Crossed Fingers', shortcode: ':crossed_fingers:', keywords: ['luck', 'hope', 'wish', 'promise'], category: 'people' },
  { emoji: '🤟', name: 'Love-You Gesture', shortcode: ':love_you_gesture:', keywords: ['love', 'ily', 'rock on'], category: 'people' },
  { emoji: '🤘', name: 'Sign of the Horns', shortcode: ':metal:', keywords: ['rock', 'metal', 'horns', 'hardcore'], category: 'people' },
  { emoji: '🤙', name: 'Call Me Hand', shortcode: ':call_me:', keywords: ['shaka', 'call', 'chill', 'bro', 'hang loose'], category: 'people' },
  { emoji: '👈', name: 'Backhand Index Pointing Left', shortcode: ':point_left:', keywords: ['left', 'point', 'direction'], category: 'people' },
  { emoji: '👉', name: 'Backhand Index Pointing Right', shortcode: ':point_right:', keywords: ['right', 'point', 'direction'], category: 'people' },
  { emoji: '👆', name: 'Backhand Index Pointing Up', shortcode: ':point_up_2:', keywords: ['up', 'point', 'above'], category: 'people' },
  { emoji: '👇', name: 'Backhand Index Pointing Down', shortcode: ':point_down:', keywords: ['down', 'point', 'below'], category: 'people' },
  { emoji: '☝️', name: 'Index Pointing Up', shortcode: ':point_up:', keywords: ['one', 'first', 'listen'], category: 'people' },
  { emoji: '👍', name: 'Thumbs Up', shortcode: ':thumbsup:', keywords: ['thumbsup', 'yes', 'good', 'agree', 'like', 'approve', 'up'], category: 'people' },
  { emoji: '👎', name: 'Thumbs Down', shortcode: ':thumbsdown:', keywords: ['thumbsdown', 'no', 'bad', 'dislike', 'disapprove', 'down'], category: 'people' },
  { emoji: '✊', name: 'Raised Fist', shortcode: ':fist:', keywords: ['fist', 'power', 'solidarity'], category: 'people' },
  { emoji: '👊', name: 'Oncoming Fist', shortcode: ':punch:', keywords: ['punch', 'fist bump', 'brofist'], category: 'people' },
  { emoji: '🤛', name: 'Left-Facing Fist', shortcode: ':left_facing_fist:', keywords: ['left fist', 'bump'], category: 'people' },
  { emoji: '🤜', name: 'Right-Facing Fist', shortcode: ':right_facing_fist:', keywords: ['right fist', 'bump'], category: 'people' },
  { emoji: '👏', name: 'Clapping Hands', shortcode: ':clap:', keywords: ['clap', 'applause', 'praise', 'bravo', 'congrats'], category: 'people' },
  { emoji: '🙌', name: 'Raising Hands', shortcode: ':raised_hands:', keywords: ['raise hands', 'celebrate', 'hooray', 'yay', 'praise'], category: 'people' },
  { emoji: '👐', name: 'Open Hands', shortcode: ':open_hands:', keywords: ['open hands', 'hug'], category: 'people' },
  { emoji: '🤲', name: 'Palms Up Together', shortcode: ':palms_up_together:', keywords: ['prayer', 'cupped hands'], category: 'people' },
  { emoji: '🤝', name: 'Handshake', shortcode: ':handshake:', keywords: ['handshake', 'deal', 'agreement', 'partner', 'friend'], category: 'people' },
  { emoji: '🙏', name: 'Folded Hands', shortcode: ':pray:', keywords: ['pray', 'please', 'thank you', 'thanks', 'bless'], category: 'people' },
  { emoji: '✍️', name: 'Writing Hand', shortcode: ':writing_hand:', keywords: ['write', 'sign', 'author'], category: 'people' },
  { emoji: '💅', name: 'Nail Polish', shortcode: ':nail_care:', keywords: ['nails', 'slay', 'glamour'], category: 'people' },
  { emoji: '🤳', name: 'Selfie', shortcode: ':selfie:', keywords: ['selfie', 'camera', 'phone'], category: 'people' },
  { emoji: '💪', name: 'Flexed Biceps', shortcode: ':muscle:', keywords: ['muscle', 'strong', 'flex', 'power', 'gym', 'bicep'], category: 'people' },
  { emoji: '🦾', name: 'Mechanical Arm', shortcode: ':mechanical_arm:', keywords: ['robot', 'prosthetic', 'cyborg'], category: 'people' },
  { emoji: '🦿', name: 'Mechanical Leg', shortcode: ':mechanical_leg:', keywords: ['robot', 'prosthetic', 'cyborg leg'], category: 'people' },
  { emoji: '🦵', name: 'Leg', shortcode: ':leg:', keywords: ['leg', 'kick', 'limb'], category: 'people' },
  { emoji: '🦶', name: 'Foot', shortcode: ':foot:', keywords: ['foot', 'step', 'walk'], category: 'people' },
  { emoji: '👂', name: 'Ear', shortcode: ':ear:', keywords: ['ear', 'hear', 'listen'], category: 'people' },
  { emoji: '👃', name: 'Nose', shortcode: ':nose:', keywords: ['nose', 'smell', 'sniff'], category: 'people' },
  { emoji: '🧠', name: 'Brain', shortcode: ':brain:', keywords: ['brain', 'smart', 'mind', 'iq', 'genius', 'think'], category: 'people' },
  { emoji: '👀', name: 'Eyes', shortcode: ':eyes:', keywords: ['eyes', 'look', 'watch', 'see', 'peek', 'look here'], category: 'people' },
  { emoji: '👁️', name: 'Eye', shortcode: ':eye:', keywords: ['eye', 'vision', 'look'], category: 'people' },
  { emoji: '👅', name: 'Tongue', shortcode: ':tongue:', keywords: ['tongue', 'taste', 'lick'], category: 'people' },
  { emoji: '👄', name: 'Mouth', shortcode: ':lips:', keywords: ['mouth', 'lips', 'kiss'], category: 'people' },
  { emoji: '🧑', name: 'Person', shortcode: ':adult:', keywords: ['person', 'human', 'avatar'], category: 'people' },
  { emoji: '👱', name: 'Person: Blond Hair', shortcode: ':person_with_blond_hair:', keywords: ['blond', 'hair', 'avatar'], category: 'people' },
  { emoji: '👨', name: 'Man', shortcode: ':man:', keywords: ['man', 'male', 'guy'], category: 'people' },
  { emoji: '👩', name: 'Woman', shortcode: ':woman:', keywords: ['woman', 'female', 'lady'], category: 'people' },
  { emoji: '🧓', name: 'Older Person', shortcode: ':older_adult:', keywords: ['elder', 'grandparent'], category: 'people' },
  { emoji: '👴', name: 'Old Man', shortcode: ':older_man:', keywords: ['grandpa', 'elder'], category: 'people' },
  { emoji: '👵', name: 'Old Woman', shortcode: ':older_woman:', keywords: ['grandma', 'elder'], category: 'people' },
  { emoji: '👮', name: 'Police Officer', shortcode: ':cop:', keywords: ['police', 'cop', 'law'], category: 'people' },
  { emoji: '🕵️', name: 'Detective', shortcode: ':detective:', keywords: ['detective', 'spy', 'investigate'], category: 'people' },
  { emoji: '💂', name: 'Guard', shortcode: ':guard:', keywords: ['guard', 'soldier', 'royal'], category: 'people' },
  { emoji: '🥷', name: 'Ninja', shortcode: ':ninja:', keywords: ['ninja', 'stealth', 'shadow'], category: 'people' },
  { emoji: '👷', name: 'Construction Worker', shortcode: ':construction_worker:', keywords: ['builder', 'worker', 'helmet'], category: 'people' },
  { emoji: '🤴', name: 'Prince', shortcode: ':prince:', keywords: ['prince', 'royal', 'king'], category: 'people' },
  { emoji: '👸', name: 'Princess', shortcode: ':princess:', keywords: ['princess', 'royal', 'queen'], category: 'people' },
  { emoji: '🦸', name: 'Superhero', shortcode: ':superhero:', keywords: ['hero', 'superhero', 'power'], category: 'people' },
  { emoji: '🦹', name: 'Supervillain', shortcode: ':supervillain:', keywords: ['villain', 'evil', 'bad guy'], category: 'people' },
  { emoji: '🧙', name: 'Mage', shortcode: ':mage:', keywords: ['wizard', 'magic', 'sorcerer'], category: 'people' },
  { emoji: '🧚', name: 'Fairy', shortcode: ':fairy:', keywords: ['fairy', 'wings', 'pixie'], category: 'people' },
  { emoji: '🧛', name: 'Vampire', shortcode: ':vampire:', keywords: ['dracula', 'blood', 'fangs'], category: 'people' },
  { emoji: '🧜', name: 'Merperson', shortcode: ':merperson:', keywords: ['mermaid', 'ocean', 'sea'], category: 'people' },
  { emoji: '🧝', name: 'Elf', shortcode: ':elf:', keywords: ['elf', 'fantasy', 'archer'], category: 'people' },
  { emoji: '🧞', name: 'Genie', shortcode: ':genie:', keywords: ['genie', 'wishes', 'lamp'], category: 'people' },
  { emoji: '🧟', name: 'Zombie', shortcode: ':zombie:', keywords: ['undead', 'zombie', 'apocalypse'], category: 'people' },
  { emoji: '🕺', name: 'Man Dancing', shortcode: ':man_dancing:', keywords: ['dance', 'disco', 'party'], category: 'people' },
  { emoji: '💃', name: 'Woman Dancing', shortcode: ':dancer:', keywords: ['dance', 'salsa', 'party'], category: 'people' },

  // ==========================================
  // 🐶 ANIMALS & NATURE (105 Emojis)
  // ==========================================
  { emoji: '🐶', name: 'Dog Face', shortcode: ':dog:', keywords: ['dog', 'puppy', 'pet', 'doggo', 'woof'], category: 'nature' },
  { emoji: '🐱', name: 'Cat Face', shortcode: ':cat:', keywords: ['cat', 'kitten', 'kitty', 'pet', 'meow'], category: 'nature' },
  { emoji: '🐭', name: 'Mouse Face', shortcode: ':mouse:', keywords: ['mouse', 'rodent', 'rat'], category: 'nature' },
  { emoji: '🐹', name: 'Hamster Face', shortcode: ':hamster:', keywords: ['hamster', 'cute', 'pet'], category: 'nature' },
  { emoji: '🐰', name: 'Rabbit Face', shortcode: ':rabbit:', keywords: ['bunny', 'rabbit', 'pet'], category: 'nature' },
  { emoji: '🦊', name: 'Fox', shortcode: ':fox:', keywords: ['fox', 'cunning', 'wild', 'animal'], category: 'nature' },
  { emoji: '🐻', name: 'Bear', shortcode: ':bear:', keywords: ['bear', 'grizzly', 'wild', 'teddy'], category: 'nature' },
  { emoji: '🐼', name: 'Panda', shortcode: ':panda_face:', keywords: ['panda', 'bamboo', 'bear', 'cute'], category: 'nature' },
  { emoji: '🐨', name: 'Koala', shortcode: ':koala:', keywords: ['koala', 'australia', 'eucalyptus'], category: 'nature' },
  { emoji: '🐯', name: 'Tiger Face', shortcode: ':tiger:', keywords: ['tiger', 'cat', 'wild', 'stripes'], category: 'nature' },
  { emoji: '🦁', name: 'Lion', shortcode: ':lion:', keywords: ['lion', 'king', 'safari', 'wild', 'mane'], category: 'nature' },
  { emoji: '🐮', name: 'Cow Face', shortcode: ':cow:', keywords: ['cow', 'moo', 'beef', 'milk'], category: 'nature' },
  { emoji: '🐷', name: 'Pig Face', shortcode: ':pig:', keywords: ['pig', 'oink', 'pork'], category: 'nature' },
  { emoji: '🐸', name: 'Frog', shortcode: ':frog:', keywords: ['frog', 'toad', 'ribbit', 'pepe'], category: 'nature' },
  { emoji: '🐵', name: 'Monkey Face', shortcode: ':monkey_face:', keywords: ['monkey', 'ape', 'chimp'], category: 'nature' },
  { emoji: '🐔', name: 'Chicken', shortcode: ':chicken:', keywords: ['chicken', 'hen', 'bird'], category: 'nature' },
  { emoji: '🐧', name: 'Penguin', shortcode: ':penguin:', keywords: ['penguin', 'antarctica', 'bird', 'cute'], category: 'nature' },
  { emoji: '🐦', name: 'Bird', shortcode: ':bird:', keywords: ['bird', 'fly', 'tweet', 'twitter'], category: 'nature' },
  { emoji: '🐤', name: 'Baby Chick', shortcode: ':baby_chick:', keywords: ['chick', 'bird', 'yellow'], category: 'nature' },
  { emoji: '🦆', name: 'Duck', shortcode: ':duck:', keywords: ['duck', 'quack', 'bird'], category: 'nature' },
  { emoji: '🦅', name: 'Eagle', shortcode: ':eagle:', keywords: ['eagle', 'bird', 'freedom', 'america', 'fly'], category: 'nature' },
  { emoji: '🦉', name: 'Owl', shortcode: ':owl:', keywords: ['owl', 'wise', 'night', 'bird'], category: 'nature' },
  { emoji: '🦇', name: 'Bat', shortcode: ':bat:', keywords: ['bat', 'vampire', 'night', 'spooky'], category: 'nature' },
  { emoji: '🐺', name: 'Wolf', shortcode: ':wolf:', keywords: ['wolf', 'howl', 'pack', 'wild', 'alpha'], category: 'nature' },
  { emoji: '🐗', name: 'Boar', shortcode: ':boar:', keywords: ['boar', 'wild pig'], category: 'nature' },
  { emoji: '🐴', name: 'Horse Face', shortcode: ':horse:', keywords: ['horse', 'pony', 'stallion'], category: 'nature' },
  { emoji: '🦄', name: 'Unicorn', shortcode: ':unicorn:', keywords: ['unicorn', 'magic', 'rainbow', 'horn'], category: 'nature' },
  { emoji: '🐝', name: 'Honeybee', shortcode: ':bee:', keywords: ['bee', 'honey', 'insect', 'buzz'], category: 'nature' },
  { emoji: '🐛', name: 'Bug', shortcode: ':bug:', keywords: ['bug', 'caterpillar', 'insect'], category: 'nature' },
  { emoji: '🦋', name: 'Butterfly', shortcode: ':butterfly:', keywords: ['butterfly', 'wings', 'insect', 'beauty'], category: 'nature' },
  { emoji: '🐌', name: 'Snail', shortcode: ':snail:', keywords: ['snail', 'slow', 'shell'], category: 'nature' },
  { emoji: '🐞', name: 'Lady Beetle', shortcode: ':lady_beetle:', keywords: ['ladybug', 'beetle'], category: 'nature' },
  { emoji: '🐜', name: 'Ant', shortcode: ':ant:', keywords: ['ant', 'colony', 'insect'], category: 'nature' },
  { emoji: '🕷️', name: 'Spider', shortcode: ':spider:', keywords: ['spider', 'web', 'spooky'], category: 'nature' },
  { emoji: '🦂', name: 'Scorpion', shortcode: ':scorpion:', keywords: ['scorpion', 'sting', 'desert'], category: 'nature' },
  { emoji: '🐢', name: 'Turtle', shortcode: ':turtle:', keywords: ['turtle', 'tortoise', 'slow', 'shell'], category: 'nature' },
  { emoji: '🐍', name: 'Snake', shortcode: ':snake:', keywords: ['snake', 'serpent', 'reptile'], category: 'nature' },
  { emoji: '🦎', name: 'Lizard', shortcode: ':lizard:', keywords: ['lizard', 'gecko', 'reptile'], category: 'nature' },
  { emoji: '🦖', name: 'T-Rex', shortcode: ':t_rex:', keywords: ['dinosaur', 'trex', 'jurassic', 'fossil'], category: 'nature' },
  { emoji: '🦕', name: 'Sauropod', shortcode: ':sauropod:', keywords: ['dinosaur', 'brontosaurus', 'jurassic'], category: 'nature' },
  { emoji: '🐙', name: 'Octopus', shortcode: ':octopus:', keywords: ['octopus', 'tentacles', 'ocean'], category: 'nature' },
  { emoji: '🦑', name: 'Squid', shortcode: ':squid:', keywords: ['squid', 'ocean', 'tentacles'], category: 'nature' },
  { emoji: '🦐', name: 'Shrimp', shortcode: ':shrimp:', keywords: ['shrimp', 'seafood', 'prawn'], category: 'nature' },
  { emoji: '🦀', name: 'Crab', shortcode: ':crab:', keywords: ['crab', 'claws', 'crustacean'], category: 'nature' },
  { emoji: '🐡', name: 'Blowfish', shortcode: ':blowfish:', keywords: ['blowfish', 'pufferfish', 'ocean'], category: 'nature' },
  { emoji: '🐠', name: 'Tropical Fish', shortcode: ':tropical_fish:', keywords: ['fish', 'aquarium', 'ocean'], category: 'nature' },
  { emoji: '🐟', name: 'Fish', shortcode: ':fish:', keywords: ['fish', 'ocean', 'sea'], category: 'nature' },
  { emoji: '🐬', name: 'Dolphin', shortcode: ':dolphin:', keywords: ['dolphin', 'ocean', 'smart'], category: 'nature' },
  { emoji: '🐳', name: 'Spouting Whale', shortcode: ':whale:', keywords: ['whale', 'ocean', 'huge'], category: 'nature' },
  { emoji: '🦈', name: 'Shark', shortcode: ':shark:', keywords: ['shark', 'ocean', 'sea', 'predator', 'jaws'], category: 'nature' },
  { emoji: '🐊', name: 'Crocodile', shortcode: ':crocodile:', keywords: ['crocodile', 'alligator', 'swamp'], category: 'nature' },
  { emoji: '🐅', name: 'Tiger', shortcode: ':tiger2:', keywords: ['tiger', 'wild', 'predator'], category: 'nature' },
  { emoji: '🐆', name: 'Leopard', shortcode: ':leopard:', keywords: ['leopard', 'cheetah', 'fast'], category: 'nature' },
  { emoji: '🦓', name: 'Zebra', shortcode: ':zebra:', keywords: ['zebra', 'stripes', 'safari'], category: 'nature' },
  { emoji: '🦍', name: 'Gorilla', shortcode: ':gorilla:', keywords: ['gorilla', 'ape', 'silverback'], category: 'nature' },
  { emoji: '🐘', name: 'Elephant', shortcode: ':elephant:', keywords: ['elephant', 'trunk', 'safari'], category: 'nature' },
  { emoji: '🦏', name: 'Rhinoceros', shortcode: ':rhinoceros:', keywords: ['rhino', 'horn', 'safari'], category: 'nature' },
  { emoji: '🐪', name: 'Camel', shortcode: ':camel:', keywords: ['camel', 'desert', 'hump'], category: 'nature' },
  { emoji: '🦒', name: 'Giraffe', shortcode: ':giraffe:', keywords: ['giraffe', 'safari', 'neck'], category: 'nature' },
  { emoji: '🦘', name: 'Kangaroo', shortcode: ':kangaroo:', keywords: ['kangaroo', 'australia', 'pouch'], category: 'nature' },
  { emoji: '🐉', name: 'Dragon', shortcode: ':dragon:', keywords: ['dragon', 'myth', 'beast', 'fire', 'legend'], category: 'nature' },
  { emoji: '🌲', name: 'Evergreen Tree', shortcode: ':evergreen_tree:', keywords: ['tree', 'forest', 'wood', 'pine', 'nature'], category: 'nature' },
  { emoji: '🌳', name: 'Deciduous Tree', shortcode: ':deciduous_tree:', keywords: ['tree', 'green', 'wood'], category: 'nature' },
  { emoji: '🌴', name: 'Palm Tree', shortcode: ':palm_tree:', keywords: ['palm', 'beach', 'tropical', 'summer'], category: 'nature' },
  { emoji: '🌵', name: 'Cactus', shortcode: ':cactus:', keywords: ['cactus', 'desert', 'plant'], category: 'nature' },
  { emoji: '🌿', name: 'Herb', shortcode: ':herb:', keywords: ['herb', 'plant', 'leaf'], category: 'nature' },
  { emoji: '☘️', name: 'Shamrock', shortcode: ':shamrock:', keywords: ['shamrock', 'irish', 'clover'], category: 'nature' },
  { emoji: '🍀', name: 'Four Leaf Clover', shortcode: ':four_leaf_clover:', keywords: ['clover', 'luck', 'lucky', 'irish', 'green'], category: 'nature' },
  { emoji: '🍁', name: 'Maple Leaf', shortcode: ':maple_leaf:', keywords: ['maple', 'canada', 'autumn', 'fall'], category: 'nature' },
  { emoji: '🍂', name: 'Fallen Leaf', shortcode: ':fallen_leaf:', keywords: ['autumn', 'fall', 'leaves'], category: 'nature' },
  { emoji: '🍃', name: 'Leaf Fluttering in Wind', shortcode: ':leaves:', keywords: ['wind', 'leaf', 'breeze'], category: 'nature' },
  { emoji: '🍄', name: 'Mushroom', shortcode: ':mushroom:', keywords: ['mushroom', 'fungus', 'mario'], category: 'nature' },
  { emoji: '🌸', name: 'Cherry Blossom', shortcode: ':cherry_blossom:', keywords: ['flower', 'cherry blossom', 'sakura', 'pink', 'spring'], category: 'nature' },
  { emoji: '🌹', name: 'Rose', shortcode: ':rose:', keywords: ['rose', 'flower', 'red', 'love', 'romance'], category: 'nature' },
  { emoji: '🌻', name: 'Sunflower', shortcode: ':sunflower:', keywords: ['sunflower', 'yellow', 'flower', 'sun'], category: 'nature' },
  { emoji: '🌼', name: 'Blossom', shortcode: ':blossom:', keywords: ['flower', 'yellow', 'blossom'], category: 'nature' },
  { emoji: '🌷', name: 'Tulip', shortcode: ':tulip:', keywords: ['tulip', 'flower', 'spring'], category: 'nature' },
  { emoji: '🌱', name: 'Seedling', shortcode: ':seedling:', keywords: ['seedling', 'plant', 'grow', 'sprout'], category: 'nature' },

  // ==========================================
  // 🍔 FOOD & DRINK (90 Emojis)
  // ==========================================
  { emoji: '🍇', name: 'Grapes', shortcode: ':grapes:', keywords: ['grapes', 'fruit', 'wine'], category: 'food' },
  { emoji: '🍉', name: 'Watermelon', shortcode: ':watermelon:', keywords: ['watermelon', 'summer', 'fruit'], category: 'food' },
  { emoji: '🍊', name: 'Tangerine', shortcode: ':tangerine:', keywords: ['orange', 'citrus', 'fruit'], category: 'food' },
  { emoji: '🍋', name: 'Lemon', shortcode: ':lemon:', keywords: ['lemon', 'citrus', 'sour'], category: 'food' },
  { emoji: '🍌', name: 'Banana', shortcode: ':banana:', keywords: ['banana', 'fruit', 'yellow'], category: 'food' },
  { emoji: '🍍', name: 'Pineapple', shortcode: ':pineapple:', keywords: ['pineapple', 'tropical', 'fruit'], category: 'food' },
  { emoji: '🍎', name: 'Red Apple', shortcode: ':apple:', keywords: ['apple', 'fruit', 'red'], category: 'food' },
  { emoji: '🍏', name: 'Green Apple', shortcode: ':green_apple:', keywords: ['apple', 'fruit', 'green'], category: 'food' },
  { emoji: '🍐', name: 'Pear', shortcode: ':pear:', keywords: ['pear', 'fruit'], category: 'food' },
  { emoji: '🍑', name: 'Peach', shortcode: ':peach:', keywords: ['peach', 'fruit', 'sweet'], category: 'food' },
  { emoji: '🍒', name: 'Cherries', shortcode: ':cherries:', keywords: ['cherries', 'fruit', 'red'], category: 'food' },
  { emoji: '🍓', name: 'Strawberry', shortcode: ':strawberry:', keywords: ['strawberry', 'fruit', 'berry'], category: 'food' },
  { emoji: '🫐', name: 'Blueberries', shortcode: ':blueberries:', keywords: ['blueberry', 'fruit', 'berry'], category: 'food' },
  { emoji: '🥝', name: 'Kiwi Fruit', shortcode: ':kiwi_fruit:', keywords: ['kiwi', 'fruit'], category: 'food' },
  { emoji: '🍅', name: 'Tomato', shortcode: ':tomato:', keywords: ['tomato', 'veg', 'salad'], category: 'food' },
  { emoji: '🥥', name: 'Coconut', shortcode: ':coconut:', keywords: ['coconut', 'tropical', 'palm'], category: 'food' },
  { emoji: '🥑', name: 'Avocado', shortcode: ':avocado:', keywords: ['avocado', 'guacamole'], category: 'food' },
  { emoji: '🍆', name: 'Eggplant', shortcode: ':eggplant:', keywords: ['eggplant', 'aubergine'], category: 'food' },
  { emoji: '🥔', name: 'Potato', shortcode: ':potato:', keywords: ['potato', 'spud'], category: 'food' },
  { emoji: '🥕', name: 'Carrot', shortcode: ':carrot:', keywords: ['carrot', 'veg'], category: 'food' },
  { emoji: '🌽', name: 'Ear of Corn', shortcode: ':corn:', keywords: ['corn', 'maize'], category: 'food' },
  { emoji: '🌶️', name: 'Hot Pepper', shortcode: ':hot_pepper:', keywords: ['chili', 'spicy', 'hot', 'pepper'], category: 'food' },
  { emoji: '🥒', name: 'Cucumber', shortcode: ':cucumber:', keywords: ['cucumber', 'pickle'], category: 'food' },
  { emoji: '🍄', name: 'Mushroom', shortcode: ':mushroom:', keywords: ['mushroom', 'food'], category: 'food' },
  { emoji: '🥜', name: 'Peanuts', shortcode: ':peanuts:', keywords: ['peanuts', 'nuts', 'snack'], category: 'food' },
  { emoji: '🍞', name: 'Bread', shortcode: ':bread:', keywords: ['bread', 'loaf', 'toast'], category: 'food' },
  { emoji: '🥐', name: 'Croissant', shortcode: ':croissant:', keywords: ['croissant', 'french', 'pastry'], category: 'food' },
  { emoji: '🥖', name: 'Baguette Bread', shortcode: ':baguette_bread:', keywords: ['baguette', 'french', 'bread'], category: 'food' },
  { emoji: '🧀', name: 'Cheese Wedge', shortcode: ':cheese:', keywords: ['cheese', 'dairy'], category: 'food' },
  { emoji: '🍖', name: 'Meat on Bone', shortcode: ':meat_on_bone:', keywords: ['meat', 'bbq'], category: 'food' },
  { emoji: '🍗', name: 'Poultry Leg', shortcode: ':poultry_leg:', keywords: ['chicken', 'drumstick'], category: 'food' },
  { emoji: '🥩', name: 'Cut of Meat', shortcode: ':cut_of_meat:', keywords: ['steak', 'beef', 'meat'], category: 'food' },
  { emoji: '🥓', name: 'Bacon', shortcode: ':bacon:', keywords: ['bacon', 'pork', 'breakfast'], category: 'food' },
  { emoji: '🍔', name: 'Hamburger', shortcode: ':hamburger:', keywords: ['burger', 'hamburger', 'cheeseburger', 'food', 'beef'], category: 'food' },
  { emoji: '🍟', name: 'French Fries', shortcode: ':fries:', keywords: ['fries', 'french fries', 'chips', 'potato', 'snack'], category: 'food' },
  { emoji: '🍕', name: 'Pizza', shortcode: ':pizza:', keywords: ['pizza', 'slice', 'cheese', 'fastfood', 'food'], category: 'food' },
  { emoji: '🌭', name: 'Hot Dog', shortcode: ':hotdog:', keywords: ['hotdog', 'sausage', 'frank', 'food'], category: 'food' },
  { emoji: '🥪', name: 'Sandwich', shortcode: ':sandwich:', keywords: ['sandwich', 'lunch'], category: 'food' },
  { emoji: '🌮', name: 'Taco', shortcode: ':taco:', keywords: ['taco', 'mexican', 'food', 'snack'], category: 'food' },
  { emoji: '🌯', name: 'Burrito', shortcode: ':burrito:', keywords: ['burrito', 'wrap', 'mexican'], category: 'food' },
  { emoji: '🍳', name: 'Cooking', shortcode: ':fried_egg:', keywords: ['egg', 'breakfast', 'fry'], category: 'food' },
  { emoji: '🍲', name: 'Pot of Food', shortcode: ':stew:', keywords: ['stew', 'soup', 'pot'], category: 'food' },
  { emoji: '🥣', name: 'Bowl with Spoon', shortcode: ':bowl_with_spoon:', keywords: ['cereal', 'soup', 'breakfast'], category: 'food' },
  { emoji: '🥗', name: 'Green Salad', shortcode: ':green_salad:', keywords: ['salad', 'healthy', 'greens'], category: 'food' },
  { emoji: '🍿', name: 'Popcorn', shortcode: ':popcorn:', keywords: ['popcorn', 'snack', 'cinema'], category: 'food' },
  { emoji: '🍱', name: 'Bento Box', shortcode: ':bento:', keywords: ['bento', 'japanese', 'lunch'], category: 'food' },
  { emoji: '🍙', name: 'Rice Ball', shortcode: ':rice_ball:', keywords: ['onigiri', 'rice'], category: 'food' },
  { emoji: '🍚', name: 'Cooked Rice', shortcode: ':rice:', keywords: ['rice', 'bowl'], category: 'food' },
  { emoji: '🍛', name: 'Curry Rice', shortcode: ':curry:', keywords: ['curry', 'rice', 'indian'], category: 'food' },
  { emoji: '🍜', name: 'Steaming Bowl', shortcode: ':ramen:', keywords: ['ramen', 'noodles', 'soup', 'bowl', 'asian'], category: 'food' },
  { emoji: '🍝', name: 'Spaghetti', shortcode: ':spaghetti:', keywords: ['pasta', 'italian', 'noodles'], category: 'food' },
  { emoji: '🍣', name: 'Sushi', shortcode: ':sushi:', keywords: ['sushi', 'japanese', 'fish', 'rice', 'salmon'], category: 'food' },
  { emoji: '🍤', name: 'Fried Shrimp', shortcode: ':fried_shrimp:', keywords: ['tempura', 'shrimp'], category: 'food' },
  { emoji: '🍦', name: 'Soft Ice Cream', shortcode: ':icecream:', keywords: ['icecream', 'dessert', 'sweet', 'cone'], category: 'food' },
  { emoji: '🍧', name: 'Shaved Ice', shortcode: ':shaved_ice:', keywords: ['shaved ice', 'dessert'], category: 'food' },
  { emoji: '🍨', name: 'Ice Cream', shortcode: ':ice_cream:', keywords: ['ice cream', 'bowl', 'dessert'], category: 'food' },
  { emoji: '🍩', name: 'Doughnut', shortcode: ':doughnut:', keywords: ['donut', 'doughnut', 'sweet', 'pastry'], category: 'food' },
  { emoji: '🍪', name: 'Cookie', shortcode: ':cookie:', keywords: ['cookie', 'chocolate', 'biscuit', 'snack'], category: 'food' },
  { emoji: '🎂', name: 'Birthday Cake', shortcode: ':birthday:', keywords: ['cake', 'birthday', 'celebration', 'party'], category: 'food' },
  { emoji: '🍰', name: 'Shortcake', shortcode: ':cake:', keywords: ['cake', 'slice', 'dessert'], category: 'food' },
  { emoji: '🧁', name: 'Cupcake', shortcode: ':cupcake:', keywords: ['cupcake', 'sweet', 'bakery'], category: 'food' },
  { emoji: '🥧', name: 'Pie', shortcode: ':pie:', keywords: ['pie', 'pastry', 'dessert'], category: 'food' },
  { emoji: '🍫', name: 'Chocolate Bar', shortcode: ':chocolate_bar:', keywords: ['chocolate', 'candy', 'sweet'], category: 'food' },
  { emoji: '🍬', name: 'Candy', shortcode: ':candy:', keywords: ['candy', 'sweet', 'sugar'], category: 'food' },
  { emoji: '🍭', name: 'Lollipop', shortcode: ':lollipop:', keywords: ['lollipop', 'candy'], category: 'food' },
  { emoji: '🍯', name: 'Honey Pot', shortcode: ':honey_pot:', keywords: ['honey', 'sweet', 'bee'], category: 'food' },
  { emoji: '🍼', name: 'Baby Bottle', shortcode: ':baby_bottle:', keywords: ['milk', 'bottle'], category: 'food' },
  { emoji: '🥛', name: 'Glass of Milk', shortcode: ':milk_glass:', keywords: ['milk', 'glass'], category: 'food' },
  { emoji: '☕', name: 'Hot Beverage', shortcode: ':coffee:', keywords: ['coffee', 'tea', 'cafe', 'morning', 'cup'], category: 'food' },
  { emoji: '🫖', name: 'Teapot', shortcode: ':teapot:', keywords: ['tea', 'pot'], category: 'food' },
  { emoji: '🍵', name: 'Teacup Without Handle', shortcode: ':tea:', keywords: ['matcha', 'green tea', 'tea'], category: 'food' },
  { emoji: '🧋', name: 'Bubble Tea', shortcode: ':boba:', keywords: ['boba', 'bubble tea', 'milktea', 'tapioca'], category: 'food' },
  { emoji: '🍶', name: 'Sake', shortcode: ':sake:', keywords: ['sake', 'japanese', 'drink'], category: 'food' },
  { emoji: '🍾', name: 'Bottle with Popping Cork', shortcode: ':champagne:', keywords: ['champagne', 'celebrate', 'cheers'], category: 'food' },
  { emoji: '🍷', name: 'Wine Glass', shortcode: ':wine_glass:', keywords: ['wine', 'drink', 'grape', 'red wine'], category: 'food' },
  { emoji: '🍸', name: 'Cocktail Glass', shortcode: ':cocktail:', keywords: ['cocktail', 'martini', 'bar'], category: 'food' },
  { emoji: '🍹', name: 'Tropical Drink', shortcode: ':tropical_drink:', keywords: ['cocktail', 'vacation', 'juice'], category: 'food' },
  { emoji: '🍺', name: 'Beer Mug', shortcode: ':beer:', keywords: ['beer', 'alcohol', 'cheers', 'pub', 'drink'], category: 'food' },
  { emoji: '🍻', name: 'Clinking Beer Mugs', shortcode: ':beers:', keywords: ['beers', 'party', 'cheers', 'drinks'], category: 'food' },
  { emoji: '🥂', name: 'Clinking Glasses', shortcode: ':clinking_glasses:', keywords: ['cheers', 'toast', 'celebrate'], category: 'food' },

  // ==========================================
  // 🚗 TRAVEL & PLACES (75 Emojis)
  // ==========================================
  { emoji: '🚗', name: 'Automobile', shortcode: ':car:', keywords: ['car', 'automobile', 'drive', 'vehicle'], category: 'travel' },
  { emoji: '🚕', name: 'Taxi', shortcode: ':taxi:', keywords: ['taxi', 'cab', 'drive'], category: 'travel' },
  { emoji: '🚙', name: 'Sport Utility Vehicle', shortcode: ':suv:', keywords: ['suv', 'jeep', 'car'], category: 'travel' },
  { emoji: '🚌', name: 'Bus', shortcode: ':bus:', keywords: ['bus', 'transit'], category: 'travel' },
  { emoji: '🏎️', name: 'Racing Car', shortcode: ':racing_car:', keywords: ['race car', 'racing', 'f1', 'speed', 'fast'], category: 'travel' },
  { emoji: '🚓', name: 'Police Car', shortcode: ':police_car:', keywords: ['police', 'cop', 'siren'], category: 'travel' },
  { emoji: '🚑', name: 'Ambulance', shortcode: ':ambulance:', keywords: ['ambulance', 'hospital', 'emergency'], category: 'travel' },
  { emoji: '🚒', name: 'Fire Engine', shortcode: ':fire_engine:', keywords: ['firetruck', 'fire', 'emergency'], category: 'travel' },
  { emoji: '🚚', name: 'Delivery Truck', shortcode: ':truck:', keywords: ['truck', 'delivery', 'cargo'], category: 'travel' },
  { emoji: '🏍️', name: 'Motorcycle', shortcode: ':motorcycle:', keywords: ['bike', 'motorcycle', 'speed', 'ride'], category: 'travel' },
  { emoji: '🚲', name: 'Bicycle', shortcode: ':bike:', keywords: ['bike', 'bicycle', 'cycle'], category: 'travel' },
  { emoji: '🛴', name: 'Kick Scooter', shortcode: ':scooter:', keywords: ['scooter', 'ride'], category: 'travel' },
  { emoji: '⛽', name: 'Fuel Pump', shortcode: ':fuelpump:', keywords: ['gas', 'fuel', 'petrol'], category: 'travel' },
  { emoji: '🚨', name: 'Police Car Light', shortcode: ':rotating_light:', keywords: ['siren', 'emergency', 'alert'], category: 'travel' },
  { emoji: '🛑', name: 'Stop Sign', shortcode: ':octagonal_sign:', keywords: ['stop', 'sign', 'red'], category: 'travel' },
  { emoji: '🚧', name: 'Construction', shortcode: ':construction:', keywords: ['construction', 'work', 'barrier'], category: 'travel' },
  { emoji: '⚓', name: 'Anchor', shortcode: ':anchor:', keywords: ['anchor', 'ship', 'sail'], category: 'travel' },
  { emoji: '⛵', name: 'Sailboat', shortcode: ':sailboat:', keywords: ['boat', 'sail', 'yacht'], category: 'travel' },
  { emoji: '🚤', name: 'Speedboat', shortcode: ':speedboat:', keywords: ['boat', 'speed', 'lake'], category: 'travel' },
  { emoji: '🛳️', name: 'Passenger Ship', shortcode: ':passenger_ship:', keywords: ['cruise', 'ship', 'ocean'], category: 'travel' },
  { emoji: '✈️', name: 'Airplane', shortcode: ':airplane:', keywords: ['plane', 'airplane', 'flight', 'travel', 'fly'], category: 'travel' },
  { emoji: '🛫', name: 'Airplane Departure', shortcode: ':flight_departure:', keywords: ['takeoff', 'plane'], category: 'travel' },
  { emoji: '🛬', name: 'Airplane Arrival', shortcode: ':flight_arrival:', keywords: ['landing', 'plane'], category: 'travel' },
  { emoji: '🚁', name: 'Helicopter', shortcode: ':helicopter:', keywords: ['chopper', 'copter'], category: 'travel' },
  { emoji: '🛰️', name: 'Satellite', shortcode: ':satellite:', keywords: ['satellite', 'space', 'orbit'], category: 'travel' },
  { emoji: '🚀', name: 'Rocket', shortcode: ':rocket:', keywords: ['rocket', 'space', 'launch', 'speed'], category: 'travel' },
  { emoji: '🛸', name: 'Flying Saucer', shortcode: ':flying_saucer:', keywords: ['ufo', 'alien', 'space'], category: 'travel' },
  { emoji: '🪐', name: 'Ringed Planet', shortcode: ':ringed_planet:', keywords: ['planet', 'space', 'saturn'], category: 'travel' },
  { emoji: '🌠', name: 'Shooting Star', shortcode: ':stars:', keywords: ['shooting star', 'wish', 'night'], category: 'travel' },
  { emoji: '🌌', name: 'Milky Way', shortcode: ':milky_way:', keywords: ['galaxy', 'space', 'stars'], category: 'travel' },
  { emoji: '🎆', name: 'Fireworks', shortcode: ':fireworks:', keywords: ['fireworks', 'celebrate', 'spark'], category: 'travel' },
  { emoji: '🎇', name: 'Sparkler', shortcode: ':sparkler:', keywords: ['sparkler', 'celebrate'], category: 'travel' },
  { emoji: '🗿', name: 'Moai', shortcode: ':moyai:', keywords: ['statue', 'easter island', 'stone'], category: 'travel' },
  { emoji: '🗽', name: 'Statue of Liberty', shortcode: ':statue_of_liberty:', keywords: ['liberty', 'new york', 'usa'], category: 'travel' },
  { emoji: '🗼', name: 'Tokyo Tower', shortcode: ':tokyo_tower:', keywords: ['tower', 'tokyo', 'japan'], category: 'travel' },
  { emoji: '🏰', name: 'Castle', shortcode: ':castle:', keywords: ['castle', 'fortress', 'kingdom', 'royal', 'medieval'], category: 'travel' },
  { emoji: '🏯', name: 'Japanese Castle', shortcode: ':japanese_castle:', keywords: ['castle', 'japan'], category: 'travel' },
  { emoji: '🏟️', name: 'Stadium', shortcode: ':stadium:', keywords: ['stadium', 'arena', 'match', 'sports', 'concert'], category: 'travel' },
  { emoji: '🎡', name: 'Ferris Wheel', shortcode: ':ferris_wheel:', keywords: ['ferris wheel', 'amusement park'], category: 'travel' },
  { emoji: '🎢', name: 'Roller Coaster', shortcode: ':roller_coaster:', keywords: ['coaster', 'amusement park', 'thrill'], category: 'travel' },
  { emoji: '🏖️', name: 'Beach with Umbrella', shortcode: ':beach:', keywords: ['beach', 'summer', 'vacation', 'ocean', 'sun'], category: 'travel' },
  { emoji: '⛺', name: 'Tent', shortcode: ':tent:', keywords: ['camping', 'tent', 'camp', 'outdoors', 'nature'], category: 'travel' },
  { emoji: '🏕️', name: 'Camping', shortcode: ':camping:', keywords: ['camping', 'nature', 'outdoors'], category: 'travel' },
  { emoji: '🏠', name: 'House', shortcode: ':house:', keywords: ['home', 'house', 'building'], category: 'travel' },
  { emoji: '🏡', name: 'House with Garden', shortcode: ':house_with_garden:', keywords: ['home', 'garden'], category: 'travel' },
  { emoji: '🏢', name: 'Office Building', shortcode: ':office:', keywords: ['office', 'work', 'city'], category: 'travel' },
  { emoji: '🏙️', name: 'Cityscape', shortcode: ':cityscape:', keywords: ['city', 'skyline', 'buildings'], category: 'travel' },

  // ==========================================
  // 💡 OBJECTS & TOOLS (90 Emojis)
  // ==========================================
  { emoji: '💡', name: 'Light Bulb', shortcode: ':bulb:', keywords: ['bulb', 'light', 'idea', 'bright', 'smart', 'genius'], category: 'objects' },
  { emoji: '🔦', name: 'Flashlight', shortcode: ':flashlight:', keywords: ['flashlight', 'light', 'torch', 'beam'], category: 'objects' },
  { emoji: '📱', name: 'Mobile Phone', shortcode: ':iphone:', keywords: ['phone', 'mobile', 'smartphone', 'iphone'], category: 'objects' },
  { emoji: '💻', name: 'Laptop', shortcode: ':computer:', keywords: ['computer', 'pc', 'laptop', 'mac'], category: 'objects' },
  { emoji: '🖥️', name: 'Desktop Computer', shortcode: ':desktop_computer:', keywords: ['desktop', 'monitor', 'screen'], category: 'objects' },
  { emoji: '🖨️', name: 'Printer', shortcode: ':printer:', keywords: ['printer', 'paper', 'office'], category: 'objects' },
  { emoji: '⌨️', name: 'Keyboard', shortcode: ':keyboard:', keywords: ['keyboard', 'type', 'gaming'], category: 'objects' },
  { emoji: '🖱️', name: 'Computer Mouse', shortcode: ':computer_mouse:', keywords: ['mouse', 'click', 'gaming'], category: 'objects' },
  { emoji: '💾', name: 'Floppy Disk', shortcode: ':floppy_disk:', keywords: ['save', 'disk', 'retro'], category: 'objects' },
  { emoji: '💿', name: 'Optical Disk', shortcode: ':cd:', keywords: ['cd', 'dvd', 'disk'], category: 'objects' },
  { emoji: '📷', name: 'Camera', shortcode: ':camera:', keywords: ['camera', 'photo', 'picture'], category: 'objects' },
  { emoji: '📸', name: 'Camera with Flash', shortcode: ':camera_flash:', keywords: ['photo', 'snap'], category: 'objects' },
  { emoji: '📹', name: 'Video Camera', shortcode: ':video_camera:', keywords: ['video', 'record'], category: 'objects' },
  { emoji: '📞', name: 'Telephone Receiver', shortcode: ':telephone_receiver:', keywords: ['call', 'phone'], category: 'objects' },
  { emoji: '📺', name: 'Television', shortcode: ':tv:', keywords: ['tv', 'screen', 'television'], category: 'objects' },
  { emoji: '📻', name: 'Radio', shortcode: ':radio:', keywords: ['radio', 'broadcast', 'podcast'], category: 'objects' },
  { emoji: '⏰', name: 'Alarm Clock', shortcode: ':alarm_clock:', keywords: ['alarm', 'wake up', 'time'], category: 'objects' },
  { emoji: '🕰️', name: 'Mantelpiece Clock', shortcode: ':clock:', keywords: ['time', 'vintage'], category: 'objects' },
  { emoji: '⌛', name: 'Hourglass Done', shortcode: ':hourglass:', keywords: ['time', 'sand', 'timer'], category: 'objects' },
  { emoji: '⏳', name: 'Hourglass Not Done', shortcode: ':hourglass_flowing_sand:', keywords: ['wait', 'loading', 'time'], category: 'objects' },
  { emoji: '🔋', name: 'Battery', shortcode: ':battery:', keywords: ['battery', 'charge', 'power'], category: 'objects' },
  { emoji: '🔌', name: 'Electric Plug', shortcode: ':electric_plug:', keywords: ['plug', 'power', 'cable'], category: 'objects' },
  { emoji: '💸', name: 'Money with Wings', shortcode: ':money_with_wings:', keywords: ['money', 'flying', 'expensive'], category: 'objects' },
  { emoji: '💵', name: 'Dollar Banknote', shortcode: ':dollar:', keywords: ['money', 'cash', 'usd'], category: 'objects' },
  { emoji: '💰', name: 'Money Bag', shortcode: ':moneybag:', keywords: ['money', 'cash', 'dollar', 'rich', 'bag'], category: 'objects' },
  { emoji: '🪙', name: 'Coin', shortcode: ':coin:', keywords: ['coin', 'gold', 'crypto', 'token', 'currency'], category: 'objects' },
  { emoji: '💳', name: 'Credit Card', shortcode: ':credit_card:', keywords: ['card', 'payment', 'buy'], category: 'objects' },
  { emoji: '💎', name: 'Gem Stone', shortcode: ':gem:', keywords: ['diamond', 'rare', 'crystal', 'boost'], category: 'objects' },
  { emoji: '🔧', name: 'Wrench', shortcode: ':wrench:', keywords: ['tool', 'fix', 'settings'], category: 'objects' },
  { emoji: '🔨', name: 'Hammer', shortcode: ':hammer:', keywords: ['hammer', 'tool', 'build'], category: 'objects' },
  { emoji: '🛠️', name: 'Hammer and Wrench', shortcode: ':hammer_and_wrench:', keywords: ['tools', 'settings', 'fix'], category: 'objects' },
  { emoji: '⛏️', name: 'Pick', shortcode: ':pick:', keywords: ['pickaxe', 'minecraft', 'mine'], category: 'objects' },
  { emoji: '🔫', name: 'Water Pistol', shortcode: ':gun:', keywords: ['gun', 'pistol', 'water gun', 'shoot'], category: 'objects' },
  { emoji: '💣', name: 'Bomb', shortcode: ':bomb:', keywords: ['bomb', 'explode', 'boom', 'blast', 'danger'], category: 'objects' },
  { emoji: '🧨', name: 'Firecracker', shortcode: ':firecracker:', keywords: ['firecracker', 'dynamite', 'tnt', 'boom'], category: 'objects' },
  { emoji: '🗡️', name: 'Dagger', shortcode: ':dagger:', keywords: ['dagger', 'knife', 'blade', 'weapon', 'assassin'], category: 'objects' },
  { emoji: '⚔️', name: 'Crossed Swords', shortcode: ':crossed_swords:', keywords: ['swords', 'pvp', 'war', 'fight'], category: 'objects' },
  { emoji: '🛡️', name: 'Shield', shortcode: ':shield:', keywords: ['shield', 'defense', 'armor'], category: 'objects' },
  { emoji: '🔮', name: 'Crystal Ball', shortcode: ':crystal_ball:', keywords: ['crystal', 'future', 'magic'], category: 'objects' },
  { emoji: '🔭', name: 'Telescope', shortcode: ':telescope:', keywords: ['telescope', 'stars', 'space'], category: 'objects' },
  { emoji: '🔬', name: 'Microscope', shortcode: ':microscope:', keywords: ['science', 'lab', 'study'], category: 'objects' },
  { emoji: '💊', name: 'Pill', shortcode: ':pill:', keywords: ['medicine', 'drug', 'health'], category: 'objects' },
  { emoji: '💉', name: 'Syringe', shortcode: ':syringe:', keywords: ['vaccine', 'shot', 'medical'], category: 'objects' },
  { emoji: '🔑', name: 'Key', shortcode: ':key:', keywords: ['key', 'password', 'access', 'secret', 'unlock'], category: 'objects' },
  { emoji: '🗝️', name: 'Old Key', shortcode: ':old_key:', keywords: ['vintage key', 'secret'], category: 'objects' },
  { emoji: '🚪', name: 'Door', shortcode: ':door:', keywords: ['door', 'enter', 'exit'], category: 'objects' },
  { emoji: '📦', name: 'Package', shortcode: ':package:', keywords: ['package', 'box', 'delivery', 'parcel'], category: 'objects' },
  { emoji: '🏷️', name: 'Label', shortcode: ':label:', keywords: ['tag', 'price', 'label'], category: 'objects' },
  { emoji: '📜', name: 'Scroll', shortcode: ':scroll:', keywords: ['scroll', 'paper', 'ancient'], category: 'objects' },
  { emoji: '📁', name: 'File Folder', shortcode: ':file_folder:', keywords: ['folder', 'files', 'directory'], category: 'objects' },
  { emoji: '🔒', name: 'Locked', shortcode: ':lock:', keywords: ['lock', 'locked', 'secure', 'private', 'safety'], category: 'objects' },
  { emoji: '🔓', name: 'Unlocked', shortcode: ':unlock:', keywords: ['unlock', 'unlocked', 'open', 'access'], category: 'objects' },
  { emoji: '🎁', name: 'Wrapped Gift', shortcode: ':gift:', keywords: ['gift', 'present', 'birthday', 'giveaway', 'surprise'], category: 'objects' },
  { emoji: '🎈', name: 'Balloon', shortcode: ':balloon:', keywords: ['balloon', 'party', 'birthday'], category: 'objects' },
  { emoji: '🎉', name: 'Party Popper', shortcode: ':tada:', keywords: ['party', 'tada', 'celebrate', 'congrats', 'popper'], category: 'objects' },
  { emoji: '✉️', name: 'Envelope', shortcode: ':envelope:', keywords: ['mail', 'letter', 'message'], category: 'objects' },

  // ==========================================
  // ❤️ SYMBOLS & FLAGS (85 Emojis)
  // ==========================================
  { emoji: '❤️', name: 'Red Heart', shortcode: ':heart:', keywords: ['heart', 'love', 'red', 'like', 'affection'], category: 'symbols' },
  { emoji: '🧡', name: 'Orange Heart', shortcode: ':orange_heart:', keywords: ['heart', 'orange', 'love'], category: 'symbols' },
  { emoji: '💛', name: 'Yellow Heart', shortcode: ':yellow_heart:', keywords: ['heart', 'yellow', 'friendship'], category: 'symbols' },
  { emoji: '💚', name: 'Green Heart', shortcode: ':green_heart:', keywords: ['heart', 'green', 'nature'], category: 'symbols' },
  { emoji: '💙', name: 'Blue Heart', shortcode: ':blue_heart:', keywords: ['heart', 'blue', 'trust'], category: 'symbols' },
  { emoji: '💜', name: 'Purple Heart', shortcode: ':purple_heart:', keywords: ['heart', 'purple', 'bts'], category: 'symbols' },
  { emoji: '🖤', name: 'Black Heart', shortcode: ':black_heart:', keywords: ['heart', 'black', 'dark'], category: 'symbols' },
  { emoji: '🤍', name: 'White Heart', shortcode: ':white_heart:', keywords: ['heart', 'white', 'pure'], category: 'symbols' },
  { emoji: '💔', name: 'Broken Heart', shortcode: ':broken_heart:', keywords: ['broken heart', 'sad', 'heartbreak', 'pain'], category: 'symbols' },
  { emoji: '💖', name: 'Sparkling Heart', shortcode: ':sparkling_heart:', keywords: ['sparkle heart', 'love', 'cute', 'shine'], category: 'symbols' },
  { emoji: '💕', name: 'Two Hearts', shortcode: ':two_hearts:', keywords: ['hearts', 'love'], category: 'symbols' },
  { emoji: '💞', name: 'Revolving Hearts', shortcode: ':revolving_hearts:', keywords: ['hearts', 'love', 'spin'], category: 'symbols' },
  { emoji: '💓', name: 'Beating Heart', shortcode: ':heartbeat:', keywords: ['heartbeat', 'love', 'pulse'], category: 'symbols' },
  { emoji: '💗', name: 'Growing Heart', shortcode: ':heartpulse:', keywords: ['heart', 'growing', 'love'], category: 'symbols' },
  { emoji: '⭐', name: 'Star', shortcode: ':star:', keywords: ['star', 'yellow', 'favorite', 'rating'], category: 'symbols' },
  { emoji: '✨', name: 'Sparkles', shortcode: ':sparkles:', keywords: ['sparkles', 'magic', 'shine', 'special', 'clean', 'boost'], category: 'symbols' },
  { emoji: '⚡', name: 'High Voltage', shortcode: ':zap:', keywords: ['lightning', 'zap', 'power'], category: 'symbols' },
  { emoji: '🔥', name: 'Fire', shortcode: ':fire:', keywords: ['fire', 'flame', 'hot', 'lit'], category: 'symbols' },
  { emoji: '⚠️', name: 'Warning', shortcode: ':warning:', keywords: ['warning', 'alert', 'caution', 'danger', 'notice'], category: 'symbols' },
  { emoji: '⛔', name: 'No Entry', shortcode: ':no_entry:', keywords: ['no entry', 'stop', 'prohibited', 'denied'], category: 'symbols' },
  { emoji: '🚫', name: 'Prohibited', shortcode: ':prohibited:', keywords: ['prohibited', 'banned', 'no', 'forbidden'], category: 'symbols' },
  { emoji: '🛑', name: 'Stop Sign', shortcode: ':octagonal_sign:', keywords: ['stop', 'halt', 'red'], category: 'symbols' },
  { emoji: '✅', name: 'Check Mark Button', shortcode: ':white_check_mark:', keywords: ['check', 'verified', 'done', 'yes', 'correct', 'ok', 'true'], category: 'symbols' },
  { emoji: '✔️', name: 'Check Mark', shortcode: ':heavy_check_mark:', keywords: ['check', 'done', 'yes'], category: 'symbols' },
  { emoji: '❌', name: 'Cross Mark', shortcode: ':x:', keywords: ['cross', 'x', 'no', 'wrong', 'cancel', 'delete', 'false'], category: 'symbols' },
  { emoji: '❎', name: 'Cross Mark Button', shortcode: ':negative_squared_cross_mark:', keywords: ['x', 'no', 'box'], category: 'symbols' },
  { emoji: '❗', name: 'Red Exclamation Mark', shortcode: ':exclamation:', keywords: ['exclamation', 'alert', 'important', 'notice', 'attention'], category: 'symbols' },
  { emoji: '❓', name: 'Question Mark', shortcode: ':question:', keywords: ['question', 'help', 'what', 'doubt', 'why'], category: 'symbols' },
  { emoji: '💯', name: 'Hundred Points', shortcode: ':100:', keywords: ['100', 'hundred', 'perfect', 'score'], category: 'symbols' },
  { emoji: '💤', name: 'Zzz', shortcode: ':zzz:', keywords: ['zzz', 'sleep', 'afk', 'inactive', 'tired'], category: 'symbols' },
  { emoji: '🏁', name: 'Chequered Flag', shortcode: ':checkered_flag:', keywords: ['flag', 'finish', 'racing', 'race', 'winner'], category: 'symbols' },
  { emoji: '🚩', name: 'Triangular Flag', shortcode: ':triangular_flag_on_post:', keywords: ['flag', 'point', 'mark'], category: 'symbols' },
  { emoji: '🏳️‍🌈', name: 'Rainbow Flag', shortcode: ':rainbow_flag:', keywords: ['pride', 'rainbow', 'lgbt'], category: 'symbols' },
  { emoji: '🏴‍☠️', name: 'Pirate Flag', shortcode: ':pirate_flag:', keywords: ['pirate', 'jolly roger', 'skull'], category: 'symbols' },
  { emoji: '🔄', name: 'Counterclockwise Arrows Button', shortcode: ':arrows_counterclockwise:', keywords: ['reload', 'refresh', 'sync'], category: 'symbols' },
  { emoji: '🔙', name: 'Back Arrow', shortcode: ':back:', keywords: ['back', 'return'], category: 'symbols' },
  { emoji: '🔜', name: 'Soon Arrow', shortcode: ':soon:', keywords: ['soon', 'coming soon'], category: 'symbols' },
  { emoji: '🔝', name: 'Top Arrow', shortcode: ':top:', keywords: ['top', 'up'], category: 'symbols' },
  { emoji: '▶️', name: 'Play Button', shortcode: ':arrow_forward:', keywords: ['play', 'start'], category: 'symbols' },
  { emoji: '⏸️', name: 'Pause Button', shortcode: ':double_vertical_bar:', keywords: ['pause', 'stop'], category: 'symbols' }
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
  const desktopPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Desktop click outside listener (safe for mobile since mobile uses portal backdrop)
  useEffect(() => {
    const handleDesktopClickOutside = (e: MouseEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        return;
      }
      if (
        desktopPickerRef.current &&
        !desktopPickerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleDesktopClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleDesktopClickOutside);
    };
  }, [onClose]);

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

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const emojiListContent = (isMobile: boolean) => (
    <>
      {/* Search Header */}
      <div className="p-3 pb-2 border-b border-white/5 flex flex-col gap-2.5">
        <div className="relative">
          <input
            ref={isMobile ? undefined : searchInputRef}
            type="text"
            placeholder="Search 800+ emojis (e.g. fire, sword, crown)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value) setActiveCategory('all');
            }}
            className="w-full pl-8 pr-7 py-2.5 sm:py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-red-500/50 transition-colors"
          />
          <Search size={14} className="absolute left-2.5 top-3 sm:top-2.5 text-zinc-400" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-3 sm:top-2.5 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        {!search && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveCategory(cat.id);
                  }}
                  className={`px-2.5 py-1.5 sm:py-1 rounded-lg text-xs sm:text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(225,29,46,0.4)]'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={cat.name}
                >
                  <Icon size={13} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Emoji Grid Area */}
      <div className={`p-2 sm:p-2 overflow-y-auto custom-scrollbar ${isMobile ? 'max-h-[48vh] min-h-[220px]' : 'max-h-64 min-h-[200px]'}`}>
        {filteredEmojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-1">
            <span className="text-3xl sm:text-2xl">🔍</span>
            <span className="text-xs font-semibold text-zinc-400">No matching emojis</span>
            <span className="text-[10.5px] text-zinc-600">Try searching for &quot;fire&quot;, &quot;sword&quot;, or &quot;crown&quot;</span>
          </div>
        ) : (
          <div className={`grid gap-1 place-items-center ${isMobile ? 'grid-cols-7' : 'grid-cols-8'}`}>
            {filteredEmojis.map((item, idx) => (
              <button
                key={`${item.shortcode}-${idx}`}
                type="button"
                onMouseEnter={() => setHoveredEmoji(item)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(item.emoji);
                  onClose();
                }}
                className={`rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                  isMobile ? 'w-11 h-11 text-2xl hover:bg-red-500/20 active:bg-red-500/30' : 'w-9 h-9 text-lg hover:bg-red-500/20 hover:scale-125'
                } ${
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
      <div className="flex items-center justify-between p-3 sm:p-2.5 px-3 bg-[#0c0d0e] border-t border-white/5 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          {hoveredEmoji ? (
            <>
              <span className="text-xl sm:text-lg leading-none">{hoveredEmoji.emoji}</span>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs sm:text-[11px] font-bold text-white truncate">{hoveredEmoji.name}</span>
                <span className="text-[10px] sm:text-[9.5px] font-mono text-zinc-400 truncate">{hoveredEmoji.shortcode}</span>
              </div>
            </>
          ) : (
            <span className="text-xs sm:text-[11px] text-zinc-500 font-mono">
              Trait Slot {slotIndex + 1}
            </span>
          )}
        </div>

        {currentEmoji && onClear && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
              onClose();
            }}
            className="text-red-400 hover:text-red-300 text-xs sm:text-[11px] font-semibold transition-colors shrink-0 ml-2 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
          >
            Remove Emoji
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* 1. Mobile Bottom Sheet Modal (rendered via portal for full touch immersion) */}
      {isClient &&
        createPortal(
          <div
            className="sm:hidden fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            {/* Bottom Sheet Drawer */}
            <div
              className="w-full bg-[#111214] border-t border-white/15 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.95)] max-h-[85vh] flex flex-col overflow-hidden text-white select-none pb-safe animate-in slide-in-from-bottom duration-250"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* Header with Title and Cross Icon Only */}
              <div className="py-3 px-4 flex items-center justify-between border-b border-white/10 relative">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-red-400" />
                  Select Trait #{slotIndex + 1} Emoji
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Emoji Content for Mobile */}
              {emojiListContent(true)}
            </div>
          </div>,
          document.body
        )}

      {/* 2. Desktop Popover Dropdown */}
      <div
        ref={desktopPickerRef}
        className="hidden sm:flex w-[360px] bg-[#111214] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(225,29,46,0.25)] flex-col overflow-hidden text-white select-none backdrop-blur-xl"
      >
        {emojiListContent(false)}
      </div>
    </>
  );
}
