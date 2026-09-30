/**
 * RNG CONTROL CENTER • DISCORD UNIFIED EMOJI DATASET
 * Supports standard Unicode emojis & Discord Bot/Custom Emojis (<:name:id>, <a:name:id>)
 * Persists user-added bot emojis and frequently used emojis in localStorage.
 */

export interface EmojiItem {
  type: 'unicode' | 'custom';
  char?: string;
  id?: string;
  name: string;
  category: string;
  keywords?: string[];
  animated?: boolean;
  url?: string;
}

export interface EmojiCategory {
  id: string;
  label: string;
  icon: string;
}

export const DISCORD_EMOJI_CATEGORIES: EmojiCategory[] = [
  { id: 'recent', label: 'Frequently Used', icon: 'fa-regular fa-clock' },
  { id: 'bot', label: 'Bot Emojis', icon: 'fa-solid fa-robot' },
  { id: 'smileys', label: 'Smileys & Emotion', icon: 'fa-regular fa-face-smile' },
  { id: 'people', label: 'People & Body', icon: 'fa-solid fa-user-group' },
  { id: 'animals', label: 'Animals & Nature', icon: 'fa-solid fa-paw' },
  { id: 'food', label: 'Food & Drink', icon: 'fa-solid fa-burger' },
  { id: 'activities', label: 'Activities', icon: 'fa-solid fa-basketball' },
  { id: 'travel', label: 'Travel & Places', icon: 'fa-solid fa-plane' },
  { id: 'objects', label: 'Objects', icon: 'fa-solid fa-lightbulb' },
  { id: 'symbols', label: 'Symbols', icon: 'fa-solid fa-icons' },
  { id: 'flags', label: 'Flags', icon: 'fa-solid fa-flag' }
];

export const DEFAULT_BOT_EMOJIS: EmojiItem[] = [
  {
    type: 'custom',
    id: '10182738491823',
    name: 'pepe_hype',
    animated: false,
    url: 'https://cdn.discordapp.com/emojis/10182738491823.webp?size=64',
    category: 'bot',
    keywords: ['pepe', 'frog', 'hype', 'dance', 'bot']
  },
  {
    type: 'custom',
    id: '98765432109876',
    name: 'nitro_boost',
    animated: true,
    url: 'https://cdn.discordapp.com/emojis/98765432109876.gif?size=64',
    category: 'bot',
    keywords: ['nitro', 'boost', 'subscriber', 'lvl', 'server']
  },
  {
    type: 'custom',
    id: '82391029384756',
    name: 'blob_dance',
    animated: true,
    url: 'https://cdn.discordapp.com/emojis/82391029384756.gif?size=64',
    category: 'bot',
    keywords: ['blob', 'dance', 'party', 'happy', 'cute']
  },
  {
    type: 'custom',
    id: '73910293847561',
    name: 'discord_verified',
    animated: false,
    url: 'https://cdn.discordapp.com/emojis/73910293847561.webp?size=64',
    category: 'bot',
    keywords: ['verified', 'bot', 'partner', 'badge', 'official']
  },
  {
    type: 'custom',
    id: '62910293847562',
    name: 'party_parrot',
    animated: true,
    url: 'https://cdn.discordapp.com/emojis/62910293847562.gif?size=64',
    category: 'bot',
    keywords: ['parrot', 'party', 'cult', 'dance', 'rainbow']
  },
  {
    type: 'custom',
    id: '51910293847563',
    name: 'cat_vibe',
    animated: true,
    url: 'https://cdn.discordapp.com/emojis/51910293847563.gif?size=64',
    category: 'bot',
    keywords: ['cat', 'vibe', 'jam', 'bop', 'music', 'cute']
  },
  {
    type: 'custom',
    id: '40910293847564',
    name: 'doge_cool',
    animated: false,
    url: 'https://cdn.discordapp.com/emojis/40910293847564.webp?size=64',
    category: 'bot',
    keywords: ['doge', 'shiba', 'sunglasses', 'swag', 'meme']
  },
  {
    type: 'custom',
    id: '39910293847565',
    name: 'fire_anim',
    animated: true,
    url: 'https://cdn.discordapp.com/emojis/39910293847565.gif?size=64',
    category: 'bot',
    keywords: ['fire', 'flame', 'lit', 'animated', 'hot']
  },
  {
    type: 'custom',
    id: '28910293847566',
    name: 'diamond_gem',
    animated: false,
    url: 'https://cdn.discordapp.com/emojis/28910293847566.webp?size=64',
    category: 'bot',
    keywords: ['diamond', 'gem', 'crystal', 'shiny', 'vip']
  },
  {
    type: 'custom',
    id: '17910293847567',
    name: 'check_animated',
    animated: true,
    url: 'https://cdn.discordapp.com/emojis/17910293847567.gif?size=64',
    category: 'bot',
    keywords: ['check', 'yes', 'confirm', 'success', 'accept']
  },
  {
    type: 'custom',
    id: '16910293847568',
    name: 'cross_red',
    animated: false,
    url: 'https://cdn.discordapp.com/emojis/16910293847568.webp?size=64',
    category: 'bot',
    keywords: ['cross', 'no', 'cancel', 'error', 'denied']
  },
  {
    type: 'custom',
    id: '15910293847569',
    name: 'crown_gold',
    animated: false,
    url: 'https://cdn.discordapp.com/emojis/15910293847569.webp?size=64',
    category: 'bot',
    keywords: ['crown', 'king', 'owner', 'winner', 'gold']
  }
];

export const UNICODE_EMOJIS: EmojiItem[] = [
  // --- SMILEYS & EMOTION ---
  { type: 'unicode', char: '😀', name: 'grinning', category: 'smileys', keywords: ['smile', 'happy', 'face'] },
  { type: 'unicode', char: '😃', name: 'smiley', category: 'smileys', keywords: ['happy', 'joy', 'smile'] },
  { type: 'unicode', char: '😄', name: 'smile', category: 'smileys', keywords: ['laugh', 'happy', 'pleased'] },
  { type: 'unicode', char: '😁', name: 'grin', category: 'smileys', keywords: ['teeth', 'smile', 'beaming'] },
  { type: 'unicode', char: '😆', name: 'laughing', category: 'smileys', keywords: ['laugh', 'satisfied', 'lol'] },
  { type: 'unicode', char: '😅', name: 'sweat_smile', category: 'smileys', keywords: ['sweat', 'relief', 'nervous'] },
  { type: 'unicode', char: '🤣', name: 'rofl', category: 'smileys', keywords: ['rolling', 'floor', 'laughing', 'lmao'] },
  { type: 'unicode', char: '😂', name: 'joy', category: 'smileys', keywords: ['tears', 'crying_laughing', 'haha'] },
  { type: 'unicode', char: '🙂', name: 'slightly_smiling', category: 'smileys', keywords: ['mild', 'smile'] },
  { type: 'unicode', char: '🙃', name: 'upside_down', category: 'smileys', keywords: ['silly', 'sarcasm', 'irony'] },
  { type: 'unicode', char: '😉', name: 'wink', category: 'smileys', keywords: ['flirt', 'joke', 'winking'] },
  { type: 'unicode', char: '😊', name: 'blush', category: 'smileys', keywords: ['sweet', 'rosy', 'shy'] },
  { type: 'unicode', char: '😇', name: 'innocent', category: 'smileys', keywords: ['angel', 'halo', 'pure'] },
  { type: 'unicode', char: '🥰', name: 'smiling_face_with_3_hearts', category: 'smileys', keywords: ['love', 'crush', 'adoring'] },
  { type: 'unicode', char: '😍', name: 'heart_eyes', category: 'smileys', keywords: ['love', 'infatuation', 'admire'] },
  { type: 'unicode', char: '🤩', name: 'star_struck', category: 'smileys', keywords: ['excited', 'star', 'eyes'] },
  { type: 'unicode', char: '😘', name: 'kissing_heart', category: 'smileys', keywords: ['kiss', 'love', 'affection'] },
  { type: 'unicode', char: '😗', name: 'kissing', category: 'smileys', keywords: ['kiss', 'duck_face'] },
  { type: 'unicode', char: '😚', name: 'kissing_closed_eyes', category: 'smileys', keywords: ['blush', 'kiss'] },
  { type: 'unicode', char: '😋', name: 'yum', category: 'smileys', keywords: ['delicious', 'tongue', 'food'] },
  { type: 'unicode', char: '😛', name: 'stuck_out_tongue', category: 'smileys', keywords: ['playful', 'silly'] },
  { type: 'unicode', char: '😜', name: 'stuck_out_tongue_winking_eye', category: 'smileys', keywords: ['crazy', 'wack'] },
  { type: 'unicode', char: '🤪', name: 'zany_face', category: 'smileys', keywords: ['goofy', 'wild', 'mad'] },
  { type: 'unicode', char: '😝', name: 'stuck_out_tongue_closed_eyes', category: 'smileys', keywords: ['prank', 'mischief'] },
  { type: 'unicode', char: '🤑', name: 'money_mouth', category: 'smileys', keywords: ['rich', 'dollar', 'cash'] },
  { type: 'unicode', char: '🤗', name: 'hugs', category: 'smileys', keywords: ['hug', 'open_arms'] },
  { type: 'unicode', char: '🤭', name: 'hand_over_mouth', category: 'smileys', keywords: ['giggle', 'oops', 'secret'] },
  { type: 'unicode', char: '🤫', name: 'shushing_face', category: 'smileys', keywords: ['quiet', 'shh', 'silence'] },
  { type: 'unicode', char: '🤔', name: 'thinking', category: 'smileys', keywords: ['ponder', 'consider', 'hmm'] },
  { type: 'unicode', char: '🤐', name: 'zipper_mouth', category: 'smileys', keywords: ['sealed', 'secret'] },
  { type: 'unicode', char: '🤨', name: 'raised_eyebrow', category: 'smileys', keywords: ['skeptical', 'distrust'] },
  { type: 'unicode', char: '😐', name: 'neutral_face', category: 'smileys', keywords: ['meh', 'blank'] },
  { type: 'unicode', char: '😑', name: 'expressionless', category: 'smileys', keywords: ['unimpressed', 'flat'] },
  { type: 'unicode', char: '😶', name: 'no_mouth', category: 'smileys', keywords: ['silent', 'mute'] },
  { type: 'unicode', char: '😏', name: 'smirk', category: 'smileys', keywords: ['smug', 'flirt'] },
  { type: 'unicode', char: '😒', name: 'unamused', category: 'smileys', keywords: ['annoyed', 'bored'] },
  { type: 'unicode', char: '🙄', name: 'roll_eyes', category: 'smileys', keywords: ['eyeroll', 'whatever'] },
  { type: 'unicode', char: '😬', name: 'grimacing', category: 'smileys', keywords: ['awkward', 'cringe'] },
  { type: 'unicode', char: '🤥', name: 'lying_face', category: 'smileys', keywords: ['pinocchio', 'lie'] },
  { type: 'unicode', char: '😌', name: 'relieved', category: 'smileys', keywords: ['peaceful', 'calm'] },
  { type: 'unicode', char: '😔', name: 'pensive', category: 'smileys', keywords: ['sad', 'regret'] },
  { type: 'unicode', char: '😪', name: 'sleepy', category: 'smileys', keywords: ['tired', 'snooze'] },
  { type: 'unicode', char: '🤤', name: 'drooling_face', category: 'smileys', keywords: ['craving', 'drool'] },
  { type: 'unicode', char: '😴', name: 'sleeping', category: 'smileys', keywords: ['zzz', 'night'] },
  { type: 'unicode', char: '😷', name: 'mask', category: 'smileys', keywords: ['sick', 'ill', 'covid'] },
  { type: 'unicode', char: '🤒', name: 'face_with_thermometer', category: 'smileys', keywords: ['fever', 'sick'] },
  { type: 'unicode', char: '🤕', name: 'face_with_head_bandage', category: 'smileys', keywords: ['hurt', 'injury'] },
  { type: 'unicode', char: '🤢', name: 'nauseated_face', category: 'smileys', keywords: ['disgusted', 'gross'] },
  { type: 'unicode', char: '🤮', name: 'vomiting_face', category: 'smileys', keywords: ['puke', 'throwup'] },
  { type: 'unicode', char: '🤧', name: 'sneezing_face', category: 'smileys', keywords: ['sneeze', 'cold'] },
  { type: 'unicode', char: '🥵', name: 'hot_face', category: 'smileys', keywords: ['heat', 'sweat', 'summer'] },
  { type: 'unicode', char: '🥶', name: 'cold_face', category: 'smileys', keywords: ['freezing', 'ice', 'winter'] },
  { type: 'unicode', char: '🥴', name: 'woozy_face', category: 'smileys', keywords: ['drunk', 'dizzy'] },
  { type: 'unicode', char: '😵', name: 'dizzy_face', category: 'smileys', keywords: ['ko', 'dead'] },
  { type: 'unicode', char: '🤯', name: 'exploding_head', category: 'smileys', keywords: ['mindblown', 'shock'] },
  { type: 'unicode', char: '🤠', name: 'cowboy_hat_face', category: 'smileys', keywords: ['western', 'sheriff'] },
  { type: 'unicode', char: '🥳', name: 'partying_face', category: 'smileys', keywords: ['celebrate', 'birthday', 'horn'] },
  { type: 'unicode', char: '😎', name: 'sunglasses', category: 'smileys', keywords: ['cool', 'rad'] },
  { type: 'unicode', char: '🤓', name: 'nerd', category: 'smileys', keywords: ['geek', 'glasses'] },
  { type: 'unicode', char: '🧐', name: 'monocle_face', category: 'smileys', keywords: ['investigate', 'curious'] },
  { type: 'unicode', char: '😕', name: 'confused', category: 'smileys', keywords: ['puzzled', 'unsure'] },
  { type: 'unicode', char: '😟', name: 'worried', category: 'smileys', keywords: ['anxious', 'concerned'] },
  { type: 'unicode', char: '🙁', name: 'slightly_frowning_face', category: 'smileys', keywords: ['sad', 'down'] },
  { type: 'unicode', char: '😮', name: 'open_mouth', category: 'smileys', keywords: ['surprise', 'wow'] },
  { type: 'unicode', char: '😯', name: 'hushed', category: 'smileys', keywords: ['quiet', 'stunned'] },
  { type: 'unicode', char: '😲', name: 'astonished', category: 'smileys', keywords: ['shocked', 'gasp'] },
  { type: 'unicode', char: '😳', name: 'flushed', category: 'smileys', keywords: ['embarrassed', 'blush'] },
  { type: 'unicode', char: '🥺', name: 'pleading_face', category: 'smileys', keywords: ['puppy_eyes', 'beg'] },
  { type: 'unicode', char: '😦', name: 'frowning_face_with_open_mouth', category: 'smileys', keywords: ['frown'] },
  { type: 'unicode', char: '😨', name: 'fearful', category: 'smileys', keywords: ['scared', 'afraid'] },
  { type: 'unicode', char: '😰', name: 'cold_sweat', category: 'smileys', keywords: ['nervous', 'anxiety'] },
  { type: 'unicode', char: '😥', name: 'sad_but_relieved_face', category: 'smileys', keywords: ['phew'] },
  { type: 'unicode', char: '😢', name: 'cry', category: 'smileys', keywords: ['tear', 'sad'] },
  { type: 'unicode', char: '😭', name: 'sob', category: 'smileys', keywords: ['bawling', 'heavy_crying'] },
  { type: 'unicode', char: '😱', name: 'scream', category: 'smileys', keywords: ['munch', 'horror'] },
  { type: 'unicode', char: '😖', name: 'confounded', category: 'smileys', keywords: ['frustrated'] },
  { type: 'unicode', char: '😣', name: 'persevere', category: 'smileys', keywords: ['struggle'] },
  { type: 'unicode', char: '😞', name: 'disappointed', category: 'smileys', keywords: ['letdown'] },
  { type: 'unicode', char: '😓', name: 'sweat', category: 'smileys', keywords: ['dejected'] },
  { type: 'unicode', char: '😩', name: 'weary', category: 'smileys', keywords: ['tired', 'done'] },
  { type: 'unicode', char: '😫', name: 'tired_face', category: 'smileys', keywords: ['exhausted'] },
  { type: 'unicode', char: '🥱', name: 'yawning_face', category: 'smileys', keywords: ['bored', 'sleepy'] },
  { type: 'unicode', char: '😤', name: 'triumph', category: 'smileys', keywords: ['steam', 'proud'] },
  { type: 'unicode', char: '😡', name: 'rage', category: 'smileys', keywords: ['angry', 'mad', 'furious'] },
  { type: 'unicode', char: '😠', name: 'angry', category: 'smileys', keywords: ['grumpy'] },
  { type: 'unicode', char: '🤬', name: 'cursing_face', category: 'smileys', keywords: ['swearing', 'censor'] },
  { type: 'unicode', char: '😈', name: 'smiling_imp', category: 'smileys', keywords: ['devil', 'evil'] },
  { type: 'unicode', char: '👿', name: 'imp', category: 'smileys', keywords: ['angry_devil'] },
  { type: 'unicode', char: '💀', name: 'skull', category: 'smileys', keywords: ['dead', 'skeleton', 'danger'] },
  { type: 'unicode', char: '☠️', name: 'skull_and_crossbones', category: 'smileys', keywords: ['pirate', 'toxic'] },
  { type: 'unicode', char: '💩', name: 'poop', category: 'smileys', keywords: ['hankey', 'shit', 'turd'] },
  { type: 'unicode', char: '🤡', name: 'clown', category: 'smileys', keywords: ['circus', 'fool'] },
  { type: 'unicode', char: '👻', name: 'ghost', category: 'smileys', keywords: ['spooky', 'halloween'] },
  { type: 'unicode', char: '👽', name: 'alien', category: 'smileys', keywords: ['ufo', 'extraterrestrial'] },
  { type: 'unicode', char: '👾', name: 'space_invader', category: 'smileys', keywords: ['retro', 'game', 'pixel'] },
  { type: 'unicode', char: '🤖', name: 'robot', category: 'smileys', keywords: ['bot', 'ai', 'tech'] },

  // --- PEOPLE & BODY ---
  { type: 'unicode', char: '👋', name: 'wave', category: 'people', keywords: ['hand', 'hello', 'bye'] },
  { type: 'unicode', char: '🤚', name: 'raised_back_of_hand', category: 'people', keywords: ['stop'] },
  { type: 'unicode', char: '🖐️', name: 'hand_splayed', category: 'people', keywords: ['five', 'fingers'] },
  { type: 'unicode', char: '✋', name: 'hand', category: 'people', keywords: ['highfive', 'stop'] },
  { type: 'unicode', char: '🖖', name: 'vulcan', category: 'people', keywords: ['spock', 'star_trek'] },
  { type: 'unicode', char: '👌', name: 'ok_hand', category: 'people', keywords: ['perfect', 'good'] },
  { type: 'unicode', char: '🤏', name: 'pinching_hand', category: 'people', keywords: ['little', 'small'] },
  { type: 'unicode', char: '✌️', name: 'v', category: 'people', keywords: ['peace', 'victory'] },
  { type: 'unicode', char: '🤞', name: 'fingers_crossed', category: 'people', keywords: ['luck', 'hope'] },
  { type: 'unicode', char: '🤟', name: 'love_you_gesture', category: 'people', keywords: ['ily', 'rock'] },
  { type: 'unicode', char: '🤘', name: 'metal', category: 'people', keywords: ['horns', 'rock_on'] },
  { type: 'unicode', char: '🤙', name: 'call_me', category: 'people', keywords: ['shaka', 'phone'] },
  { type: 'unicode', char: '👈', name: 'point_left', category: 'people', keywords: ['finger', 'direction'] },
  { type: 'unicode', char: '👉', name: 'point_right', category: 'people', keywords: ['finger', 'direction'] },
  { type: 'unicode', char: '👆', name: 'point_up_2', category: 'people', keywords: ['up'] },
  { type: 'unicode', char: '🖕', name: 'middle_finger', category: 'people', keywords: ['flip_off'] },
  { type: 'unicode', char: '👇', name: 'point_down', category: 'people', keywords: ['down'] },
  { type: 'unicode', char: '☝️', name: 'point_up', category: 'people', keywords: ['first'] },
  { type: 'unicode', char: '👍', name: 'thumbsup', category: 'people', keywords: ['like', 'approve', 'yes'] },
  { type: 'unicode', char: '👎', name: 'thumbsdown', category: 'people', keywords: ['dislike', 'no'] },
  { type: 'unicode', char: '✊', name: 'fist', category: 'people', keywords: ['power', 'solidarity'] },
  { type: 'unicode', char: '👊', name: 'punch', category: 'people', keywords: ['brofist', 'bump'] },
  { type: 'unicode', char: '🤛', name: 'left_facing_fist', category: 'people', keywords: ['fist_bump'] },
  { type: 'unicode', char: '🤜', name: 'right_facing_fist', category: 'people', keywords: ['fist_bump'] },
  { type: 'unicode', char: '👏', name: 'clap', category: 'people', keywords: ['applause', 'praise'] },
  { type: 'unicode', char: '🙌', name: 'raised_hands', category: 'people', keywords: ['hooray', 'celebrate'] },
  { type: 'unicode', char: '👐', name: 'open_hands', category: 'people', keywords: ['hug'] },
  { type: 'unicode', char: '🤲', name: 'palms_up_together', category: 'people', keywords: ['prayer'] },
  { type: 'unicode', char: '🤝', name: 'handshake', category: 'people', keywords: ['deal', 'agreement'] },
  { type: 'unicode', char: '🙏', name: 'pray', category: 'people', keywords: ['please', 'thanks', 'hope'] },
  { type: 'unicode', char: '✍️', name: 'writing_hand', category: 'people', keywords: ['pen', 'write'] },
  { type: 'unicode', char: '💅', name: 'nail_care', category: 'people', keywords: ['polish', 'sassy'] },
  { type: 'unicode', char: '🤳', name: 'selfie', category: 'people', keywords: ['camera', 'photo'] },
  { type: 'unicode', char: '💪', name: 'muscle', category: 'people', keywords: ['flex', 'strong', 'bicep'] },
  { type: 'unicode', char: '🦾', name: 'mechanical_arm', category: 'people', keywords: ['prosthetic', 'cyborg'] },
  { type: 'unicode', char: '👀', name: 'eyes', category: 'people', keywords: ['look', 'see', 'peek'] },
  { type: 'unicode', char: '🧠', name: 'brain', category: 'people', keywords: ['mind', 'smart'] },

  // --- ANIMALS & NATURE ---
  { type: 'unicode', char: '🐶', name: 'dog', category: 'animals', keywords: ['puppy', 'pet'] },
  { type: 'unicode', char: '🐱', name: 'cat', category: 'animals', keywords: ['kitten', 'feline'] },
  { type: 'unicode', char: '🐭', name: 'mouse', category: 'animals', keywords: ['rodent'] },
  { type: 'unicode', char: '🐹', name: 'hamster', category: 'animals', keywords: ['pet', 'rodent'] },
  { type: 'unicode', char: '🐰', name: 'rabbit', category: 'animals', keywords: ['bunny'] },
  { type: 'unicode', char: '🦊', name: 'fox', category: 'animals', keywords: ['wild'] },
  { type: 'unicode', char: '🐻', name: 'bear', category: 'animals', keywords: ['nature'] },
  { type: 'unicode', char: '🐼', name: 'panda', category: 'animals', keywords: ['bamboo'] },
  { type: 'unicode', char: '🐨', name: 'koala', category: 'animals', keywords: ['australia'] },
  { type: 'unicode', char: '🐯', name: 'tiger', category: 'animals', keywords: ['stripes'] },
  { type: 'unicode', char: '🦁', name: 'lion', category: 'animals', keywords: ['king'] },
  { type: 'unicode', char: '🐮', name: 'cow', category: 'animals', keywords: ['milk'] },
  { type: 'unicode', char: '🐷', name: 'pig', category: 'animals', keywords: ['pork'] },
  { type: 'unicode', char: '🐸', name: 'frog', category: 'animals', keywords: ['toad', 'pepe'] },
  { type: 'unicode', char: '🐵', name: 'monkey', category: 'animals', keywords: ['banana'] },
  { type: 'unicode', char: '🐔', name: 'chicken', category: 'animals', keywords: ['bird'] },
  { type: 'unicode', char: '🐧', name: 'penguin', category: 'animals', keywords: ['antarctica', 'linux'] },
  { type: 'unicode', char: '🐦', name: 'bird', category: 'animals', keywords: ['tweet'] },
  { type: 'unicode', char: '🦅', name: 'eagle', category: 'animals', keywords: ['bird', 'america'] },
  { type: 'unicode', char: '🦆', name: 'duck', category: 'animals', keywords: ['quack'] },
  { type: 'unicode', char: '🦉', name: 'owl', category: 'animals', keywords: ['wise'] },
  { type: 'unicode', char: '🦇', name: 'bat', category: 'animals', keywords: ['vampire'] },
  { type: 'unicode', char: '🐺', name: 'wolf', category: 'animals', keywords: ['howl'] },
  { type: 'unicode', char: '🦄', name: 'unicorn', category: 'animals', keywords: ['magic', 'fantasy'] },
  { type: 'unicode', char: '🐝', name: 'bee', category: 'animals', keywords: ['honey'] },
  { type: 'unicode', char: '🐛', name: 'bug', category: 'animals', keywords: ['code', 'insect'] },
  { type: 'unicode', char: '🦋', name: 'butterfly', category: 'animals', keywords: ['pretty'] },
  { type: 'unicode', char: '🐌', name: 'snail', category: 'animals', keywords: ['slow'] },
  { type: 'unicode', char: '🐙', name: 'octopus', category: 'animals', keywords: ['sea'] },
  { type: 'unicode', char: '🦈', name: 'shark', category: 'animals', keywords: ['ocean', 'danger'] },
  { type: 'unicode', char: '🌲', name: 'evergreen_tree', category: 'animals', keywords: ['nature', 'forest'] },
  { type: 'unicode', char: '🌸', name: 'cherry_blossom', category: 'animals', keywords: ['flower', 'sakura'] },
  { type: 'unicode', char: '🌹', name: 'rose', category: 'animals', keywords: ['flower', 'love'] },
  { type: 'unicode', char: '🌻', name: 'sunflower', category: 'animals', keywords: ['summer'] },

  // --- FOOD & DRINK ---
  { type: 'unicode', char: '🍎', name: 'apple', category: 'food', keywords: ['fruit', 'red'] },
  { type: 'unicode', char: '🍌', name: 'banana', category: 'food', keywords: ['fruit', 'yellow'] },
  { type: 'unicode', char: '🍉', name: 'watermelon', category: 'food', keywords: ['fruit', 'summer'] },
  { type: 'unicode', char: '🍇', name: 'grapes', category: 'food', keywords: ['fruit'] },
  { type: 'unicode', char: '🍓', name: 'strawberry', category: 'food', keywords: ['berry'] },
  { type: 'unicode', char: '🍒', name: 'cherries', category: 'food', keywords: ['fruit'] },
  { type: 'unicode', char: '🥑', name: 'avocado', category: 'food', keywords: ['guac'] },
  { type: 'unicode', char: '🍔', name: 'hamburger', category: 'food', keywords: ['burger', 'fast_food'] },
  { type: 'unicode', char: '🍟', name: 'fries', category: 'food', keywords: ['french_fries'] },
  { type: 'unicode', char: '🍕', name: 'pizza', category: 'food', keywords: ['slice', 'cheese'] },
  { type: 'unicode', char: '🌭', name: 'hotdog', category: 'food', keywords: ['sausage'] },
  { type: 'unicode', char: '🥪', name: 'sandwich', category: 'food', keywords: ['bread'] },
  { type: 'unicode', char: '🌮', name: 'taco', category: 'food', keywords: ['mexican'] },
  { type: 'unicode', char: '🌯', name: 'burrito', category: 'food', keywords: ['wrap'] },
  { type: 'unicode', char: '🍜', name: 'ramen', category: 'food', keywords: ['noodles', 'soup'] },
  { type: 'unicode', char: '🍣', name: 'sushi', category: 'food', keywords: ['japanese', 'fish'] },
  { type: 'unicode', char: '🍦', name: 'ice_cream', category: 'food', keywords: ['sweet', 'dessert'] },
  { type: 'unicode', char: '🍩', name: 'doughnut', category: 'food', keywords: ['donut', 'sweet'] },
  { type: 'unicode', char: '🍪', name: 'cookie', category: 'food', keywords: ['chocolate', 'biscuit'] },
  { type: 'unicode', char: '🎂', name: 'birthday_cake', category: 'food', keywords: ['party', 'celebration'] },
  { type: 'unicode', char: '🍫', name: 'chocolate_bar', category: 'food', keywords: ['candy'] },
  { type: 'unicode', char: '🍿', name: 'popcorn', category: 'food', keywords: ['movie', 'snack'] },
  { type: 'unicode', char: '☕', name: 'coffee', category: 'food', keywords: ['caffeine', 'espresso', 'tea'] },
  { type: 'unicode', char: '🧋', name: 'boba', category: 'food', keywords: ['bubble_tea', 'tea'] },
  { type: 'unicode', char: '🍺', name: 'beer', category: 'food', keywords: ['drink', 'alcohol'] },
  { type: 'unicode', char: '🍻', name: 'beers', category: 'food', keywords: ['cheers', 'drink'] },
  { type: 'unicode', char: '🍷', name: 'wine_glass', category: 'food', keywords: ['red_wine'] },
  { type: 'unicode', char: '🍹', name: 'cocktail', category: 'food', keywords: ['drink', 'tropical'] },

  // --- ACTIVITIES ---
  { type: 'unicode', char: '⚽', name: 'soccer', category: 'activities', keywords: ['football', 'sport'] },
  { type: 'unicode', char: '🏀', name: 'basketball', category: 'activities', keywords: ['hoop', 'sport'] },
  { type: 'unicode', char: '🏈', name: 'football', category: 'activities', keywords: ['american_football'] },
  { type: 'unicode', char: '⚾', name: 'baseball', category: 'activities', keywords: ['sport'] },
  { type: 'unicode', char: '🥎', name: 'softball', category: 'activities', keywords: ['sport'] },
  { type: 'unicode', char: '🎾', name: 'tennis', category: 'activities', keywords: ['sport'] },
  { type: 'unicode', char: '🏐', name: 'volleyball', category: 'activities', keywords: ['sport'] },
  { type: 'unicode', char: '🏉', name: 'rugby_football', category: 'activities', keywords: ['rugby'] },
  { type: 'unicode', char: '🥏', name: 'flying_disc', category: 'activities', keywords: ['frisbee'] },
  { type: 'unicode', char: '🎱', name: '8ball', category: 'activities', keywords: ['billiards', 'pool'] },
  { type: 'unicode', char: '🏓', name: 'ping_pong', category: 'activities', keywords: ['table_tennis'] },
  { type: 'unicode', char: '🏸', name: 'badminton', category: 'activities', keywords: ['shuttlecock'] },
  { type: 'unicode', char: '🥊', name: 'boxing_glove', category: 'activities', keywords: ['fight'] },
  { type: 'unicode', char: '🥋', name: 'martial_arts_uniform', category: 'activities', keywords: ['karate', 'judo'] },
  { type: 'unicode', char: '🥅', name: 'goal_net', category: 'activities', keywords: ['sports'] },
  { type: 'unicode', char: '⛳', name: 'golf', category: 'activities', keywords: ['hole'] },
  { type: 'unicode', char: '⛸️', name: 'ice_skate', category: 'activities', keywords: ['skating'] },
  { type: 'unicode', char: '🎣', name: 'fishing_pole_and_fish', category: 'activities', keywords: ['fishing'] },
  { type: 'unicode', char: '🤿', name: 'diving_mask', category: 'activities', keywords: ['scuba'] },
  { type: 'unicode', char: '🎽', name: 'running_shirt_with_sash', category: 'activities', keywords: ['athletics'] },
  { type: 'unicode', char: '🎿', name: 'ski', category: 'activities', keywords: ['snow'] },
  { type: 'unicode', char: '🛷', name: 'sled', category: 'activities', keywords: ['snow'] },
  { type: 'unicode', char: '🥌', name: 'curling_stone', category: 'activities', keywords: ['ice'] },
  { type: 'unicode', char: '🎯', name: 'dart', category: 'activities', keywords: ['target', 'bullseye'] },
  { type: 'unicode', char: '🪀', name: 'yo_yo', category: 'activities', keywords: ['toy'] },
  { type: 'unicode', char: '🪁', name: 'kite', category: 'activities', keywords: ['wind'] },
  { type: 'unicode', char: '🎮', name: 'video_game', category: 'activities', keywords: ['controller', 'gaming', 'play', 'ps5', 'xbox'] },
  { type: 'unicode', char: '🕹️', name: 'joystick', category: 'activities', keywords: ['arcade'] },
  { type: 'unicode', char: '🎰', name: 'slot_machine', category: 'activities', keywords: ['casino', 'gamble'] },
  { type: 'unicode', char: '🎲', name: 'game_die', category: 'activities', keywords: ['dice', 'random', 'gambling'] },
  { type: 'unicode', char: '🧩', name: 'jigsaw', category: 'activities', keywords: ['puzzle'] },
  { type: 'unicode', char: '🧸', name: 'teddy_bear', category: 'activities', keywords: ['toy', 'cute'] },
  { type: 'unicode', char: '♠️', name: 'spades', category: 'activities', keywords: ['cards'] },
  { type: 'unicode', char: '♥️', name: 'hearts', category: 'activities', keywords: ['cards'] },
  { type: 'unicode', char: '♦️', name: 'diamonds', category: 'activities', keywords: ['cards'] },
  { type: 'unicode', char: '♣️', name: 'clubs', category: 'activities', keywords: ['cards'] },
  { type: 'unicode', char: '🃏', name: 'black_joker', category: 'activities', keywords: ['joker', 'cards'] },
  { type: 'unicode', char: '🀄', name: 'mahjong', category: 'activities', keywords: ['red_dragon'] },
  { type: 'unicode', char: '🏆', name: 'trophy', category: 'activities', keywords: ['winner', 'first', 'champion'] },
  { type: 'unicode', char: '🥇', name: 'first_place_medal', category: 'activities', keywords: ['gold', 'first'] },
  { type: 'unicode', char: '🥈', name: 'second_place_medal', category: 'activities', keywords: ['silver', 'second'] },
  { type: 'unicode', char: '🥉', name: 'third_place_medal', category: 'activities', keywords: ['bronze', 'third'] },
  { type: 'unicode', char: '🏅', name: 'medal', category: 'activities', keywords: ['award'] },
  { type: 'unicode', char: '🎖️', name: 'military_medal', category: 'activities', keywords: ['honor'] },
  { type: 'unicode', char: '🎟️', name: 'admission_tickets', category: 'activities', keywords: ['event'] },
  { type: 'unicode', char: '🎫', name: 'ticket', category: 'activities', keywords: ['pass', 'support'] },
  { type: 'unicode', char: '🎪', name: 'circus_tent', category: 'activities', keywords: ['carnival'] },
  { type: 'unicode', char: '🎨', name: 'art', category: 'activities', keywords: ['palette', 'design', 'paint'] },
  { type: 'unicode', char: '🎭', name: 'performing_arts', category: 'activities', keywords: ['theater', 'drama'] },
  { type: 'unicode', char: '🎤', name: 'microphone', category: 'activities', keywords: ['sing', 'karaoke'] },
  { type: 'unicode', char: '🎧', name: 'headphones', category: 'activities', keywords: ['music', 'listen'] },
  { type: 'unicode', char: '🎼', name: 'musical_score', category: 'activities', keywords: ['music'] },
  { type: 'unicode', char: '🎹', name: 'musical_keyboard', category: 'activities', keywords: ['piano'] },
  { type: 'unicode', char: '🥁', name: 'drum', category: 'activities', keywords: ['beat'] },
  { type: 'unicode', char: '🎷', name: 'saxophone', category: 'activities', keywords: ['jazz'] },
  { type: 'unicode', char: '🎺', name: 'trumpet', category: 'activities', keywords: ['brass'] },
  { type: 'unicode', char: '🎸', name: 'guitar', category: 'activities', keywords: ['rock', 'music'] },
  { type: 'unicode', char: '🪕', name: 'banjo', category: 'activities', keywords: ['music'] },
  { type: 'unicode', char: '🎻', name: 'violin', category: 'activities', keywords: ['orchestra'] },

  // --- TRAVEL & PLACES ---
  { type: 'unicode', char: '🚗', name: 'car', category: 'travel', keywords: ['automobile', 'drive'] },
  { type: 'unicode', char: '🚕', name: 'taxi', category: 'travel', keywords: ['cab'] },
  { type: 'unicode', char: '🚙', name: 'suv', category: 'travel', keywords: ['car'] },
  { type: 'unicode', char: '🏎️', name: 'racing_car', category: 'travel', keywords: ['f1', 'speed'] },
  { type: 'unicode', char: '🚓', name: 'police_car', category: 'travel', keywords: ['cops', 'siren'] },
  { type: 'unicode', char: '🚑', name: 'ambulance', category: 'travel', keywords: ['medical', 'hospital'] },
  { type: 'unicode', char: '🚒', name: 'fire_engine', category: 'travel', keywords: ['firefighter'] },
  { type: 'unicode', char: '🚐', name: 'minibus', category: 'travel', keywords: ['van'] },
  { type: 'unicode', char: '🛻', name: 'pickup_truck', category: 'travel', keywords: ['truck'] },
  { type: 'unicode', char: '🚚', name: 'truck', category: 'travel', keywords: ['delivery'] },
  { type: 'unicode', char: '🚛', name: 'articulated_lorry', category: 'travel', keywords: ['semi'] },
  { type: 'unicode', char: '🚜', name: 'tractor', category: 'travel', keywords: ['farm'] },
  { type: 'unicode', char: '🏍️', name: 'motorcycle', category: 'travel', keywords: ['bike'] },
  { type: 'unicode', char: '🛵', name: 'motor_scooter', category: 'travel', keywords: ['vespa'] },
  { type: 'unicode', char: '🚲', name: 'bike', category: 'travel', keywords: ['bicycle'] },
  { type: 'unicode', char: '🛴', name: 'kick_scooter', category: 'travel', keywords: ['scooter'] },
  { type: 'unicode', char: '🛹', name: 'skateboard', category: 'travel', keywords: ['skate'] },
  { type: 'unicode', char: '🚨', name: 'rotating_light', category: 'travel', keywords: ['police', 'emergency', 'alert'] },
  { type: 'unicode', char: '🚥', name: 'traffic_light', category: 'travel', keywords: ['stop', 'go'] },
  { type: 'unicode', char: '🛑', name: 'stop_sign', category: 'travel', keywords: ['halt', 'octagonal'] },
  { type: 'unicode', char: '⛽', name: 'fuelpump', category: 'travel', keywords: ['gas', 'station'] },
  { type: 'unicode', char: '🚀', name: 'rocket', category: 'travel', keywords: ['space', 'launch', 'fast', 'boost'] },
  { type: 'unicode', char: '🛸', name: 'flying_saucer', category: 'travel', keywords: ['ufo', 'alien'] },
  { type: 'unicode', char: '🛰️', name: 'satellite', category: 'travel', keywords: ['space', 'orbit'] },
  { type: 'unicode', char: '✈️', name: 'airplane', category: 'travel', keywords: ['flight', 'travel'] },
  { type: 'unicode', char: '🛫', name: 'flight_departure', category: 'travel', keywords: ['takeoff'] },
  { type: 'unicode', char: '🛬', name: 'flight_arrival', category: 'travel', keywords: ['landing'] },
  { type: 'unicode', char: '🛩️', name: 'small_airplane', category: 'travel', keywords: ['flight'] },
  { type: 'unicode', char: '🚁', name: 'helicopter', category: 'travel', keywords: ['chopper'] },
  { type: 'unicode', char: '⛵', name: 'sailboat', category: 'travel', keywords: ['boat', 'sea'] },
  { type: 'unicode', char: '🚤', name: 'speedboat', category: 'travel', keywords: ['water'] },
  { type: 'unicode', char: '🚢', name: 'ship', category: 'travel', keywords: ['cruise', 'ocean'] },
  { type: 'unicode', char: '⚓', name: 'anchor', category: 'travel', keywords: ['navy', 'boat'] },
  { type: 'unicode', char: '🏰', name: 'castle', category: 'travel', keywords: ['fortress', 'kingdom'] },
  { type: 'unicode', char: '🏯', name: 'japanese_castle', category: 'travel', keywords: ['japan'] },
  { type: 'unicode', char: '🗼', name: 'tokyo_tower', category: 'travel', keywords: ['japan'] },
  { type: 'unicode', char: '🗽', name: 'statue_of_liberty', category: 'travel', keywords: ['nyc', 'america'] },
  { type: 'unicode', char: '🌋', name: 'volcano', category: 'travel', keywords: ['lava', 'eruption'] },
  { type: 'unicode', char: '⛰️', name: 'mountain', category: 'travel', keywords: ['climb', 'hike'] },
  { type: 'unicode', char: '🏕️', name: 'camping', category: 'travel', keywords: ['tent', 'outdoors'] },
  { type: 'unicode', char: '🏖️', name: 'beach_with_umbrella', category: 'travel', keywords: ['vacation', 'summer'] },
  { type: 'unicode', char: '🏝️', name: 'desert_island', category: 'travel', keywords: ['tropical'] },
  { type: 'unicode', char: '🌍', name: 'earth_africa', category: 'travel', keywords: ['globe', 'world'] },
  { type: 'unicode', char: '🌎', name: 'earth_americas', category: 'travel', keywords: ['globe', 'world'] },
  { type: 'unicode', char: '🌏', name: 'earth_asia', category: 'travel', keywords: ['globe', 'world'] },
  { type: 'unicode', char: '🌕', name: 'full_moon', category: 'travel', keywords: ['space', 'night'] },
  { type: 'unicode', char: '🪐', name: 'ringed_planet', category: 'travel', keywords: ['saturn', 'space'] },
  { type: 'unicode', char: '⭐', name: 'star', category: 'travel', keywords: ['space', 'night'] },
  { type: 'unicode', char: '☀️', name: 'sunny', category: 'travel', keywords: ['sun', 'weather'] },
  { type: 'unicode', char: '⛅', name: 'partly_sunny', category: 'travel', keywords: ['clouds'] },
  { type: 'unicode', char: '🌧️', name: 'cloud_with_rain', category: 'travel', keywords: ['weather'] },
  { type: 'unicode', char: '⛈️', name: 'thunder_cloud_and_rain', category: 'travel', keywords: ['storm'] },

  // --- OBJECTS ---
  { type: 'unicode', char: '📱', name: 'iphone', category: 'objects', keywords: ['mobile', 'smartphone', 'apple'] },
  { type: 'unicode', char: '📲', name: 'calling', category: 'objects', keywords: ['call', 'phone'] },
  { type: 'unicode', char: '💻', name: 'computer', category: 'objects', keywords: ['laptop', 'pc', 'code', 'dev'] },
  { type: 'unicode', char: '🖥️', name: 'desktop', category: 'objects', keywords: ['monitor', 'screen'] },
  { type: 'unicode', char: '🖨️', name: 'printer', category: 'objects', keywords: ['paper'] },
  { type: 'unicode', char: '⌨️', name: 'keyboard', category: 'objects', keywords: ['typing', 'keys'] },
  { type: 'unicode', char: '🖱️', name: 'mouse_three_button', category: 'objects', keywords: ['click'] },
  { type: 'unicode', char: '💽', name: 'minidisc', category: 'objects', keywords: ['data', 'disk'] },
  { type: 'unicode', char: '💾', name: 'floppy_disk', category: 'objects', keywords: ['save', 'retro'] },
  { type: 'unicode', char: '💿', name: 'cd', category: 'objects', keywords: ['disk', 'music'] },
  { type: 'unicode', char: '📀', name: 'dvd', category: 'objects', keywords: ['movie'] },
  { type: 'unicode', char: '📷', name: 'camera', category: 'objects', keywords: ['photo'] },
  { type: 'unicode', char: '📸', name: 'camera_with_flash', category: 'objects', keywords: ['photo'] },
  { type: 'unicode', char: '📹', name: 'video_camera', category: 'objects', keywords: ['record'] },
  { type: 'unicode', char: '🎥', name: 'movie_camera', category: 'objects', keywords: ['video', 'film'] },
  { type: 'unicode', char: '📺', name: 'tv', category: 'objects', keywords: ['television'] },
  { type: 'unicode', char: '📻', name: 'radio', category: 'objects', keywords: ['podcast'] },
  { type: 'unicode', char: '🎙️', name: 'studio_microphone', category: 'objects', keywords: ['podcast', 'voice'] },
  { type: 'unicode', char: '⏱️', name: 'stopwatch', category: 'objects', keywords: ['time', 'speed'] },
  { type: 'unicode', char: '⏲️', name: 'timer_clock', category: 'objects', keywords: ['countdown'] },
  { type: 'unicode', char: '⏰', name: 'alarm_clock', category: 'objects', keywords: ['wake', 'time'] },
  { type: 'unicode', char: '🕰️', name: 'mantelpiece_clock', category: 'objects', keywords: ['antique'] },
  { type: 'unicode', char: '💡', name: 'bulb', category: 'objects', keywords: ['idea', 'light'] },
  { type: 'unicode', char: '🔦', name: 'flashlight', category: 'objects', keywords: ['torch'] },
  { type: 'unicode', char: '🕯️', name: 'candle', category: 'objects', keywords: ['flame'] },
  { type: 'unicode', char: '🪔', name: 'diya_lamp', category: 'objects', keywords: ['oil'] },
  { type: 'unicode', char: '📖', name: 'book', category: 'objects', keywords: ['read', 'study'] },
  { type: 'unicode', char: '📚', name: 'books', category: 'objects', keywords: ['library', 'study'] },
  { type: 'unicode', char: '📜', name: 'scroll', category: 'objects', keywords: ['rules', 'ancient', 'paper'] },
  { type: 'unicode', char: '📄', name: 'page_facing_up', category: 'objects', keywords: ['document', 'file'] },
  { type: 'unicode', char: '📃', name: 'page_with_curl', category: 'objects', keywords: ['terms', 'license'] },
  { type: 'unicode', char: '📑', name: 'bookmark_tabs', category: 'objects', keywords: ['order'] },
  { type: 'unicode', char: '📊', name: 'bar_chart', category: 'objects', keywords: ['stats', 'analytics', 'graph'] },
  { type: 'unicode', char: '📈', name: 'chart_with_upwards_trend', category: 'objects', keywords: ['growth', 'stocks'] },
  { type: 'unicode', char: '📉', name: 'chart_with_downwards_trend', category: 'objects', keywords: ['loss'] },
  { type: 'unicode', char: '💰', name: 'moneybag', category: 'objects', keywords: ['dollar', 'wealth', 'rich'] },
  { type: 'unicode', char: '🪙', name: 'coin', category: 'objects', keywords: ['gold', 'currency'] },
  { type: 'unicode', char: '💵', name: 'dollar', category: 'objects', keywords: ['cash', 'money'] },
  { type: 'unicode', char: '💳', name: 'credit_card', category: 'objects', keywords: ['billing', 'pay', 'store'] },
  { type: 'unicode', char: '💎', name: 'gem', category: 'objects', keywords: ['diamond', 'valuable', 'nitro'] },
  { type: 'unicode', char: '🔧', name: 'wrench', category: 'objects', keywords: ['tool', 'fix', 'settings'] },
  { type: 'unicode', char: '🪛', name: 'screwdriver', category: 'objects', keywords: ['tool'] },
  { type: 'unicode', char: '🔨', name: 'hammer', category: 'objects', keywords: ['build', 'ban', 'mod'] },
  { type: 'unicode', char: '⛏️', name: 'pick', category: 'objects', keywords: ['mine', 'minecraft'] },
  { type: 'unicode', char: '🪓', name: 'axe', category: 'objects', keywords: ['chop'] },
  { type: 'unicode', char: '⚙️', name: 'gear', category: 'objects', keywords: ['cog', 'settings', 'config'] },
  { type: 'unicode', char: '🗜️', name: 'compression', category: 'objects', keywords: ['zip'] },
  { type: 'unicode', char: '⚖️', name: 'scales', category: 'objects', keywords: ['justice', 'law'] },
  { type: 'unicode', char: '🔗', name: 'link', category: 'objects', keywords: ['url', 'hyperlink', 'chain'] },
  { type: 'unicode', char: '⛓️', name: 'chains', category: 'objects', keywords: ['locked'] },
  { type: 'unicode', char: '🪝', name: 'hook', category: 'objects', keywords: ['catch', 'webhook'] },
  { type: 'unicode', char: '🧲', name: 'magnet', category: 'objects', keywords: ['attract'] },
  { type: 'unicode', char: '🪜', name: 'ladder', category: 'objects', keywords: ['climb'] },
  { type: 'unicode', char: '⚔️', name: 'crossed_swords', category: 'objects', keywords: ['battle', 'pvp', 'weapon'] },
  { type: 'unicode', char: '🗡️', name: 'dagger', category: 'objects', keywords: ['knife'] },
  { type: 'unicode', char: '🛡️', name: 'shield', category: 'objects', keywords: ['protect', 'defense', 'security'] },
  { type: 'unicode', char: '🏹', name: 'bow_and_arrow', category: 'objects', keywords: ['archery'] },
  { type: 'unicode', char: '💣', name: 'bomb', category: 'objects', keywords: ['explosion', 'nuke'] },
  { type: 'unicode', char: '🧨', name: 'firecracker', category: 'objects', keywords: ['dynamite'] },
  { type: 'unicode', char: '🔫', name: 'gun', category: 'objects', keywords: ['water_gun', 'weapon'] },
  { type: 'unicode', char: '🔑', name: 'key', category: 'objects', keywords: ['lock', 'password', 'access', 'auth'] },
  { type: 'unicode', char: '🗝️', name: 'old_key', category: 'objects', keywords: ['secret'] },
  { type: 'unicode', char: '🔒', name: 'lock', category: 'objects', keywords: ['secure', 'private'] },
  { type: 'unicode', char: '🔓', name: 'unlock', category: 'objects', keywords: ['open'] },
  { type: 'unicode', char: '🔏', name: 'lock_with_ink_pen', category: 'objects', keywords: ['privacy'] },
  { type: 'unicode', char: '🔐', name: 'closed_lock_with_key', category: 'objects', keywords: ['security'] },
  { type: 'unicode', char: '🔔', name: 'bell', category: 'objects', keywords: ['notification', 'alert', 'sound'] },
  { type: 'unicode', char: '🔕', name: 'no_bell', category: 'objects', keywords: ['mute'] },
  { type: 'unicode', char: '📦', name: 'package', category: 'objects', keywords: ['box', 'parcel', 'deliver'] },
  { type: 'unicode', char: '📫', name: 'mailbox', category: 'objects', keywords: ['mail', 'inbox'] },
  { type: 'unicode', char: '📬', name: 'mailbox_with_mail', category: 'objects', keywords: ['unread'] },
  { type: 'unicode', char: '📮', name: 'postbox', category: 'objects', keywords: ['letter'] },
  { type: 'unicode', char: '✉️', name: 'envelope', category: 'objects', keywords: ['mail', 'email'] },
  { type: 'unicode', char: '🎁', name: 'gift', category: 'objects', keywords: ['present', 'birthday', 'giveaway'] },
  { type: 'unicode', char: '🏷️', name: 'label', category: 'objects', keywords: ['tag', 'price'] },
  { type: 'unicode', char: '🛒', name: 'shopping_cart', category: 'objects', keywords: ['store', 'buy'] },
  { type: 'unicode', char: '🛍️', name: 'shopping_bags', category: 'objects', keywords: ['mall', 'purchases'] },

  // --- SYMBOLS ---
  { type: 'unicode', char: '❤️', name: 'heart', category: 'symbols', keywords: ['love', 'red_heart'] },
  { type: 'unicode', char: '🧡', name: 'orange_heart', category: 'symbols', keywords: ['love'] },
  { type: 'unicode', char: '💛', name: 'yellow_heart', category: 'symbols', keywords: ['love'] },
  { type: 'unicode', char: '💚', name: 'green_heart', category: 'symbols', keywords: ['love'] },
  { type: 'unicode', char: '💙', name: 'blue_heart', category: 'symbols', keywords: ['love'] },
  { type: 'unicode', char: '💜', name: 'purple_heart', category: 'symbols', keywords: ['love'] },
  { type: 'unicode', char: '🖤', name: 'black_heart', category: 'symbols', keywords: ['dark'] },
  { type: 'unicode', char: '🤍', name: 'white_heart', category: 'symbols', keywords: ['pure'] },
  { type: 'unicode', char: '🤎', name: 'brown_heart', category: 'symbols', keywords: ['love'] },
  { type: 'unicode', char: '💔', name: 'broken_heart', category: 'symbols', keywords: ['breakup', 'heartbreak'] },
  { type: 'unicode', char: '❤️‍🔥', name: 'heart_on_fire', category: 'symbols', keywords: ['passion'] },
  { type: 'unicode', char: '💖', name: 'sparkling_heart', category: 'symbols', keywords: ['special'] },
  { type: 'unicode', char: '💗', name: 'growing_heart', category: 'symbols', keywords: ['pulse'] },
  { type: 'unicode', char: '💓', name: 'beating_heart', category: 'symbols', keywords: ['heartbeat'] },
  { type: 'unicode', char: '💞', name: 'revolving_hearts', category: 'symbols', keywords: ['circle'] },
  { type: 'unicode', char: '💯', name: '100', category: 'symbols', keywords: ['score', 'perfect', 'hundred'] },
  { type: 'unicode', char: '💢', name: 'anger', category: 'symbols', keywords: ['anime', 'mad'] },
  { type: 'unicode', char: '💥', name: 'boom', category: 'symbols', keywords: ['collision', 'explode'] },
  { type: 'unicode', char: '💫', name: 'dizzy', category: 'symbols', keywords: ['star', 'spark'] },
  { type: 'unicode', char: '💦', name: 'sweat_drops', category: 'symbols', keywords: ['water', 'splash'] },
  { type: 'unicode', char: '💨', name: 'dash', category: 'symbols', keywords: ['fast', 'wind', 'smoke'] },
  { type: 'unicode', char: '✨', name: 'sparkles', category: 'symbols', keywords: ['stars', 'magic', 'clean', 'new'] },
  { type: 'unicode', char: '🌟', name: 'glowing_star', category: 'symbols', keywords: ['shine'] },
  { type: 'unicode', char: '⚡', name: 'zap', category: 'symbols', keywords: ['lightning', 'bolt', 'thunder', 'fast'] },
  { type: 'unicode', char: '🔥', name: 'fire', category: 'symbols', keywords: ['hot', 'flame', 'lit'] },
  { type: 'unicode', char: '❄️', name: 'snowflake', category: 'symbols', keywords: ['cold', 'winter'] },
  { type: 'unicode', char: '🌈', name: 'rainbow', category: 'symbols', keywords: ['pride', 'color'] },
  { type: 'unicode', char: '☀️', name: 'sun', category: 'symbols', keywords: ['day'] },
  { type: 'unicode', char: '⭐', name: 'star', category: 'symbols', keywords: ['rate'] },
  { type: 'unicode', char: '✅', name: 'white_check_mark', category: 'symbols', keywords: ['yes', 'correct', 'check'] },
  { type: 'unicode', char: '☑️', name: 'ballot_box_with_check', category: 'symbols', keywords: ['vote'] },
  { type: 'unicode', char: '✔️', name: 'heavy_check_mark', category: 'symbols', keywords: ['done'] },
  { type: 'unicode', char: '❌', name: 'x', category: 'symbols', keywords: ['no', 'delete', 'cancel'] },
  { type: 'unicode', char: '❎', name: 'negative_squared_cross_mark', category: 'symbols', keywords: ['reject'] },
  { type: 'unicode', char: '➕', name: 'heavy_plus_sign', category: 'symbols', keywords: ['add'] },
  { type: 'unicode', char: '➖', name: 'heavy_minus_sign', category: 'symbols', keywords: ['subtract'] },
  { type: 'unicode', char: '➗', name: 'heavy_division_sign', category: 'symbols', keywords: ['divide'] },
  { type: 'unicode', char: '✖️', name: 'heavy_multiplication_x', category: 'symbols', keywords: ['multiply'] },
  { type: 'unicode', char: '❓', name: 'question', category: 'symbols', keywords: ['help', 'what'] },
  { type: 'unicode', char: '❔', name: 'grey_question', category: 'symbols', keywords: ['query'] },
  { type: 'unicode', char: '❕', name: 'grey_exclamation', category: 'symbols', keywords: ['notice'] },
  { type: 'unicode', char: '❗', name: 'exclamation', category: 'symbols', keywords: ['warning', 'important'] },
  { type: 'unicode', char: '⚠️', name: 'warning', category: 'symbols', keywords: ['caution', 'alert'] },
  { type: 'unicode', char: '🚫', name: 'no_entry_sign', category: 'symbols', keywords: ['forbidden', 'stop'] },
  { type: 'unicode', char: '⛔', name: 'no_entry', category: 'symbols', keywords: ['denied'] },
  { type: 'unicode', char: '📛', name: 'name_badge', category: 'symbols', keywords: ['badge'] },
  { type: 'unicode', char: '🔰', name: 'beginner', category: 'symbols', keywords: ['novice'] },
  { type: 'unicode', char: '⭕', name: 'heavy_large_circle', category: 'symbols', keywords: ['ring'] },
  { type: 'unicode', char: '🛑', name: 'stop', category: 'symbols', keywords: ['stop'] },
  { type: 'unicode', char: '🔴', name: 'red_circle', category: 'symbols', keywords: ['rng', 'red'] },
  { type: 'unicode', char: '🟠', name: 'orange_circle', category: 'symbols', keywords: ['orange'] },
  { type: 'unicode', char: '🟡', name: 'yellow_circle', category: 'symbols', keywords: ['yellow'] },
  { type: 'unicode', char: '🟢', name: 'green_circle', category: 'symbols', keywords: ['online', 'active'] },
  { type: 'unicode', char: '🔵', name: 'blue_circle', category: 'symbols', keywords: ['blue'] },
  { type: 'unicode', char: '🟣', name: 'purple_circle', category: 'symbols', keywords: ['purple'] },
  { type: 'unicode', char: '⚫', name: 'black_circle', category: 'symbols', keywords: ['offline'] },
  { type: 'unicode', char: '⚪', name: 'white_circle', category: 'symbols', keywords: ['idle'] },
  { type: 'unicode', char: '🟥', name: 'red_square', category: 'symbols', keywords: ['red'] },
  { type: 'unicode', char: '🟩', name: 'green_square', category: 'symbols', keywords: ['green'] },
  { type: 'unicode', char: '🟦', name: 'blue_square', category: 'symbols', keywords: ['blue'] },
  { type: 'unicode', char: '🟨', name: 'yellow_square', category: 'symbols', keywords: ['yellow'] },
  { type: 'unicode', char: '⬛', name: 'black_large_square', category: 'symbols', keywords: ['black'] },
  { type: 'unicode', char: '⬜', name: 'white_large_square', category: 'symbols', keywords: ['white'] },
  { type: 'unicode', char: '🔈', name: 'speaker', category: 'symbols', keywords: ['audio'] },
  { type: 'unicode', char: '🔊', name: 'loud_sound', category: 'symbols', keywords: ['volume'] },
  { type: 'unicode', char: '🔇', name: 'mute', category: 'symbols', keywords: ['silent'] },
  { type: 'unicode', char: '📢', name: 'loudspeaker', category: 'symbols', keywords: ['announcement', 'megaphone'] },
  { type: 'unicode', char: '📣', name: 'mega', category: 'symbols', keywords: ['shout', 'cheer'] },
  { type: 'unicode', char: '💬', name: 'speech_balloon', category: 'symbols', keywords: ['chat', 'message'] },
  { type: 'unicode', char: '👁️‍🗨️', name: 'eye_speech_bubble', category: 'symbols', keywords: ['witness'] },
  { type: 'unicode', char: '💭', name: 'thought_balloon', category: 'symbols', keywords: ['thinking'] },
  { type: 'unicode', char: '♨️', name: 'hotsprings', category: 'symbols', keywords: ['steam'] },
  { type: 'unicode', char: '♾️', name: 'infinity', category: 'symbols', keywords: ['forever'] },
  { type: 'unicode', char: '🆔', name: 'id', category: 'symbols', keywords: ['identifier'] },
  { type: 'unicode', char: '🆒', name: 'cool', category: 'symbols', keywords: ['words'] },
  { type: 'unicode', char: '🆕', name: 'new', category: 'symbols', keywords: ['fresh'] },
  { type: 'unicode', char: '🆓', name: 'free', category: 'symbols', keywords: ['zero'] },
  { type: 'unicode', char: '🆙', name: 'up', category: 'symbols', keywords: ['level'] },
  { type: 'unicode', char: '🆗', name: 'ok', category: 'symbols', keywords: ['agree'] },
  { type: 'unicode', char: '0️⃣', name: 'zero', category: 'symbols', keywords: ['0'] },
  { type: 'unicode', char: '1️⃣', name: 'one', category: 'symbols', keywords: ['1'] },
  { type: 'unicode', char: '2️⃣', name: 'two', category: 'symbols', keywords: ['2'] },
  { type: 'unicode', char: '3️⃣', name: 'three', category: 'symbols', keywords: ['3'] },
  { type: 'unicode', char: '4️⃣', name: 'four', category: 'symbols', keywords: ['4'] },
  { type: 'unicode', char: '5️⃣', name: 'five', category: 'symbols', keywords: ['5'] },
  { type: 'unicode', char: '6️⃣', name: 'six', category: 'symbols', keywords: ['6'] },
  { type: 'unicode', char: '7️⃣', name: 'seven', category: 'symbols', keywords: ['7'] },
  { type: 'unicode', char: '8️⃣', name: 'eight', category: 'symbols', keywords: ['8'] },
  { type: 'unicode', char: '9️⃣', name: 'nine', category: 'symbols', keywords: ['9'] },
  { type: 'unicode', char: '🔟', name: 'keycap_ten', category: 'symbols', keywords: ['10'] },
  { type: 'unicode', char: '▶️', name: 'play', category: 'symbols', keywords: ['arrow'] },
  { type: 'unicode', char: '⏸️', name: 'pause', category: 'symbols', keywords: ['hold'] },
  { type: 'unicode', char: '⏹️', name: 'stop_button', category: 'symbols', keywords: ['halt'] },
  { type: 'unicode', char: '🔄', name: 'arrows_counterclockwise', category: 'symbols', keywords: ['sync', 'refresh'] },
  { type: 'unicode', char: '⬆️', name: 'arrow_up', category: 'symbols', keywords: ['direction'] },
  { type: 'unicode', char: '⬇️', name: 'arrow_down', category: 'symbols', keywords: ['direction'] },
  { type: 'unicode', char: '⬅️', name: 'arrow_left', category: 'symbols', keywords: ['direction'] },
  { type: 'unicode', char: '➡️', name: 'arrow_right', category: 'symbols', keywords: ['direction'] },

  // --- FLAGS ---
  { type: 'unicode', char: '🏁', name: 'checkered_flag', category: 'flags', keywords: ['race', 'finish'] },
  { type: 'unicode', char: '🚩', name: 'triangular_flag_on_post', category: 'flags', keywords: ['red_flag', 'point'] },
  { type: 'unicode', char: '🎌', name: 'crossed_flags', category: 'flags', keywords: ['celebrate'] },
  { type: 'unicode', char: '🏴', name: 'black_flag', category: 'flags', keywords: ['pirate'] },
  { type: 'unicode', char: '🏳️', name: 'white_flag', category: 'flags', keywords: ['peace'] },
  { type: 'unicode', char: '🏳️‍🌈', name: 'rainbow_flag', category: 'flags', keywords: ['pride', 'lgbt'] },
  { type: 'unicode', char: '🏳️‍⚧️', name: 'transgender_flag', category: 'flags', keywords: ['pride'] },
  { type: 'unicode', char: '🏴‍☠️', name: 'pirate_flag', category: 'flags', keywords: ['skull'] },
  { type: 'unicode', char: '🇺🇸', name: 'flag_us', category: 'flags', keywords: ['usa', 'america', 'united_states'] },
  { type: 'unicode', char: '🇬🇧', name: 'flag_gb', category: 'flags', keywords: ['uk', 'britain', 'united_kingdom'] },
  { type: 'unicode', char: '🇨🇦', name: 'flag_ca', category: 'flags', keywords: ['canada'] },
  { type: 'unicode', char: '🇦🇺', name: 'flag_au', category: 'flags', keywords: ['australia'] },
  { type: 'unicode', char: '🇩🇪', name: 'flag_de', category: 'flags', keywords: ['germany'] },
  { type: 'unicode', char: '🇫🇷', name: 'flag_fr', category: 'flags', keywords: ['france'] },
  { type: 'unicode', char: '🇯🇵', name: 'flag_jp', category: 'flags', keywords: ['japan'] },
  { type: 'unicode', char: '🇮🇳', name: 'flag_in', category: 'flags', keywords: ['india'] },
  { type: 'unicode', char: '🇧🇷', name: 'flag_br', category: 'flags', keywords: ['brazil'] },
  { type: 'unicode', char: '🇰🇷', name: 'flag_kr', category: 'flags', keywords: ['korea'] },
  { type: 'unicode', char: '🇮🇹', name: 'flag_it', category: 'flags', keywords: ['italy'] },
  { type: 'unicode', char: '🇪🇸', name: 'flag_es', category: 'flags', keywords: ['spain'] },
  { type: 'unicode', char: '🇷🇺', name: 'flag_ru', category: 'flags', keywords: ['russia'] },
  { type: 'unicode', char: '🇲🇽', name: 'flag_mx', category: 'flags', keywords: ['mexico'] }
];

// ==========================================================================
// LOCAL STORAGE & EMOJI REPOSITORY HELPERS
// ==========================================================================

const LOCAL_STORAGE_KEY_CUSTOM_EMOJIS = 'rng_discord_custom_emojis';
const LOCAL_STORAGE_KEY_RECENT_EMOJIS = 'rng_discord_recent_emojis';

/**
 * Retrieve all custom bot emojis (combining built-in defaults + user added)
 */
export function getCustomBotEmojis(): EmojiItem[] {
  if (typeof window === 'undefined') return [...DEFAULT_BOT_EMOJIS];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_EMOJIS);
    if (!stored) return [...DEFAULT_BOT_EMOJIS];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [...DEFAULT_BOT_EMOJIS];

    // Deduplicate by ID
    const customMap = new Map<string, EmojiItem>();
    DEFAULT_BOT_EMOJIS.forEach(e => {
      if (e.id) customMap.set(e.id, e);
    });
    parsed.forEach((e: EmojiItem) => {
      if (e.id) customMap.set(e.id, e);
    });
    return Array.from(customMap.values());
  } catch (err) {
    console.warn('Error reading custom emojis from localStorage:', err);
    return [...DEFAULT_BOT_EMOJIS];
  }
}

/**
 * Save a newly added custom bot emoji
 * Supports:
 * - Direct object: { name, id, animated, url }
 * - Discord formatted string: <:name:id> or <a:name:id>
 */
export function saveCustomBotEmoji(input: string | Partial<EmojiItem>): EmojiItem {
  let emojiObj: EmojiItem | null = null;

  if (typeof input === 'string') {
    const raw = input.trim();
    // Parse Discord custom emoji pattern: <:name:123456789> or <a:name:123456789>
    const match = raw.match(/<(a)?:([a-zA-Z0-9_]+):([0-9]+)>/);
    if (match) {
      const isAnimated = match[1] === 'a';
      const name = match[2];
      const id = match[3];
      const ext = isAnimated ? 'gif' : 'webp';
      emojiObj = {
        type: 'custom',
        id: id,
        name: name,
        animated: isAnimated,
        url: `https://cdn.discordapp.com/emojis/${id}.${ext}?size=64`,
        category: 'bot',
        keywords: [name, 'custom', 'bot']
      };
    } else {
      throw new Error('Invalid Discord emoji string format. Expected <:name:id> or <a:name:id>');
    }
  } else if (typeof input === 'object' && input !== null) {
    if (!input.name || !input.id) {
      throw new Error('Custom emoji requires at least a name and an ID.');
    }
    const isAnimated = Boolean(input.animated);
    const ext = isAnimated ? 'gif' : 'webp';
    emojiObj = {
      type: 'custom',
      id: String(input.id).trim(),
      name: String(input.name).replace(/[^a-zA-Z0-9_]/g, '').trim(),
      animated: isAnimated,
      url: input.url || `https://cdn.discordapp.com/emojis/${input.id}.${ext}?size=64`,
      category: 'bot',
      keywords: [input.name, 'custom', 'bot']
    };
  }

  if (!emojiObj) throw new Error('Could not parse custom emoji input.');

  try {
    const existing = getCustomBotEmojis();
    // Check if duplicate ID exists, replace or append
    const updated = existing.filter(e => e.id !== emojiObj!.id);
    updated.unshift(emojiObj);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_EMOJIS, JSON.stringify(updated));
    }
    return emojiObj;
  } catch (err) {
    console.error('Failed to save custom emoji:', err);
    throw err;
  }
}

/**
 * Remove a custom bot emoji by ID
 */
export function removeCustomBotEmoji(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomBotEmojis();
    const filtered = existing.filter(e => e.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_EMOJIS, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to remove custom emoji:', err);
  }
}

/**
 * Get frequently used emojis (stored in localStorage)
 */
export function getFrequentlyUsedEmojis(): EmojiItem[] {
  if (typeof window === 'undefined') return DEFAULT_BOT_EMOJIS.slice(0, 8);
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_RECENT_EMOJIS);
    if (!stored) {
      // Default top picks
      return [
        UNICODE_EMOJIS[0], // 😀
        UNICODE_EMOJIS[1], // 😃
        UNICODE_EMOJIS[17], // 🚀
        UNICODE_EMOJIS[19], // ⚡
        UNICODE_EMOJIS[20], // 🔥
        DEFAULT_BOT_EMOJIS[0], // pepe_hype
        DEFAULT_BOT_EMOJIS[1], // nitro_boost
        DEFAULT_BOT_EMOJIS[2]  // blob_dance
      ].filter(Boolean);
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Track an emoji as frequently used
 */
export function recordEmojiUsage(emoji: EmojiItem): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getFrequentlyUsedEmojis();
    const identifier = emoji.type === 'custom' ? emoji.id : emoji.char;
    const filtered = current.filter(e => (e.type === 'custom' ? e.id : e.char) !== identifier);
    filtered.unshift(emoji);
    const capped = filtered.slice(0, 18);
    localStorage.setItem(LOCAL_STORAGE_KEY_RECENT_EMOJIS, JSON.stringify(capped));
  } catch {
    // Non-fatal
  }
}

export function formatEmojiInsertString(emoji: EmojiItem): string {
  if (emoji.type === 'custom') {
    return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
  }
  return emoji.char || '';
}

/**
 * Server Emojis Specification & Helpers
 * Supports server-specific custom emojis for the active Discord Guild.
 */
export function getDefaultServerEmojis(serverId?: string, serverName?: string): EmojiItem[] {
  const prefix = serverName
    ? serverName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10).replace(/^_+|_+$/g, '')
    : 'guild';

  return [
    {
      type: 'custom',
      id: '1318001001',
      name: `${prefix || 'server'}_verified`,
      animated: false,
      url: 'https://cdn.discordapp.com/emojis/10182738491823.webp?size=64',
      category: 'server',
      keywords: ['verified', 'official', 'guild', 'badge', 'server', prefix]
    },
    {
      type: 'custom',
      id: '1318001002',
      name: `${prefix || 'server'}_boost`,
      animated: true,
      url: 'https://cdn.discordapp.com/emojis/98765432109876.gif?size=64',
      category: 'server',
      keywords: ['boost', 'nitro', 'guild', 'server', 'fire', prefix]
    },
    {
      type: 'custom',
      id: '1318001003',
      name: `${prefix || 'server'}_party`,
      animated: true,
      url: 'https://cdn.discordapp.com/emojis/82391029384756.gif?size=64',
      category: 'server',
      keywords: ['party', 'dance', 'celebrate', 'guild', 'server', prefix]
    },
    {
      type: 'custom',
      id: '1318001004',
      name: `${prefix || 'server'}_crown`,
      animated: false,
      url: 'https://cdn.discordapp.com/emojis/76543210987654.webp?size=64',
      category: 'server',
      keywords: ['crown', 'vip', 'owner', 'king', 'guild', prefix]
    },
    {
      type: 'custom',
      id: '1318001005',
      name: `${prefix || 'server'}_shield`,
      animated: false,
      url: 'https://cdn.discordapp.com/emojis/91827364510293.webp?size=64',
      category: 'server',
      keywords: ['shield', 'mod', 'staff', 'security', 'guild', prefix]
    },
    {
      type: 'custom',
      id: '1318001006',
      name: `${prefix || 'server'}_heart`,
      animated: true,
      url: 'https://cdn.discordapp.com/emojis/67584930291827.gif?size=64',
      category: 'server',
      keywords: ['heart', 'love', 'guild', 'server', 'community', prefix]
    }
  ];
}

export function getServerEmojis(serverId?: string, serverName?: string): EmojiItem[] {
  if (typeof window === 'undefined') return getDefaultServerEmojis(serverId, serverName);
  try {
    const key = serverId ? `rng_server_emojis_${serverId}` : 'rng_server_emojis_default';
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return getDefaultServerEmojis(serverId, serverName);
}

