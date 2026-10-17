'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Clock,
  Smile,
  ThumbsUp,
  Heart,
  Lightbulb,
  Bot,
  Sparkles,
  Search,
} from 'lucide-react';

export interface CustomEmoji {
  id: string;
  name: string;
  url: string;
  animated?: boolean;
}

export interface EmojiCategory {
  id: string;
  name: string;
  emojis: (string | CustomEmoji)[];
}

export interface EmojiPickerProps {
  onSelect: (emoji: string | CustomEmoji) => void;
  customCategories?: EmojiCategory[];
  recentStorageKey?: string;
  placeholder?: string;
  className?: string;
}

export const STANDARD_EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
      '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦',
      '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
      '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
      '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂'
    ],
  },
  {
    id: 'symbols',
    name: 'Symbols',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '🛡️', '⚔️', '⚡', '🔥', '✨', '⭐', '🌟', '💥', '💯', '💢',
      '🚨', '⚠️', '⛔', '🚫', '✅', '❌', '❓', '❗', '💤', '👑'
    ],
  },
  {
    id: 'objects',
    name: 'Objects',
    emojis: [
      '📱', '💻', '🖥️', '⌨️', '🖱️', '🕹️', '💽', '💾', '💿', '📀',
      '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🗑️', '🗄️', '🔒', '🔓',
      '🔑', '🗝️', '🔨', '⛏️', '⚒️', '🛠️', '🗡️', '🔫', '💣', '🧨'
    ],
  },
];

export const UNICODE_EMOJI_NAMES: Record<string, string> = {
  // Smileys & Emotion
  '😀': 'grinning', '😃': 'smiley', '😄': 'smile', '😁': 'grin', '😆': 'laughing',
  '😅': 'sweat_smile', '🤣': 'rofl', '😂': 'joy', '🙂': 'slightly_smiling_face', '🙃': 'upside_down_face',
  '😉': 'wink', '😊': 'blush', '😇': 'innocent', '🥰': 'smiling_face_with_3_hearts', '😍': 'heart_eyes',
  '🤩': 'star_struck', '😘': 'kissing_heart', '😗': 'kissing', '😚': 'kissing_closed_eyes', '😙': 'kissing_smiling_eyes',
  '😋': 'yum', '😛': 'stuck_out_tongue', '😜': 'stuck_out_tongue_winking_eye', '🤪': 'zany_face', '😝': 'stuck_out_tongue_closed_eyes',
  '🤑': 'money_mouth', '🤗': 'hugs', '🤭': 'hand_over_mouth', '🤫': 'shushing_face', '🤔': 'thinking',
  '🤐': 'zipper_mouth', '🤨': 'raised_eyebrow', '😐': 'neutral_face', '😑': 'expressionless', '😶': 'no_mouth',
  '😏': 'smirk', '😒': 'unamused', '🙄': 'rolling_eyes', '😬': 'grimacing', '🤥': 'lying_face',
  '😌': 'relieved', '😔': 'pensive', '😪': 'sleepy', '🤤': 'drooling_face', '😴': 'sleeping',
  '😷': 'mask', '🤒': 'face_with_thermometer', '🤕': 'head_bandage', '🤢': 'nauseated_face', '🤮': 'vomiting',
  '🤧': 'sneezing_face', '🥵': 'hot_face', '🥶': 'cold_face', '🥴': 'woozy_face', '😵': 'dizzy_face',
  '🤯': 'exploding_head', '🤠': 'cowboy', '🥳': 'partying_face', '😎': 'sunglasses', '🤓': 'nerd',
  '🧐': 'monocle', '😕': 'confused', '😟': 'worried', '🙁': 'slightly_frowning_face', '😮': 'open_mouth',
  '😲': 'astonished', '😳': 'flushed', '🥺': 'pleading_face', '😦': 'frowning', '😧': 'anguished',
  '😨': 'fearful', '😰': 'cold_sweat', '😥': 'disappointed_relieved', '😢': 'cry', '😭': 'sob',
  '😱': 'scream', '😖': 'confounded', '😣': 'persevere', '😞': 'disappointed', '😓': 'sweat',
  '😩': 'weary', '😫': 'tired_face', '🥱': 'yawning_face', '😤': 'triumph', '😡': 'rage',
  '😠': 'angry', '🤬': 'cursing_face', '😈': 'smiling_imp', '👿': 'imp', '💀': 'skull',
  '☠️': 'skull_crossbones', '☠': 'skull_crossbones', '💩': 'poop', '🤡': 'clown', '👹': 'japanese_ogre', '👺': 'japanese_goblin',
  '👻': 'ghost', '👽': 'alien', '👾': 'space_invader', '🤖': 'robot',

  // Gestures & People
  '👋': 'wave', '🤚': 'raised_back_of_hand', '🖐️': 'raised_hand_with_fingers_splayed', '🖐': 'raised_hand_with_fingers_splayed',
  '✋': 'hand', '🖖': 'vulcan', '👌': 'ok_hand', '🤌': 'pinched_fingers', '🤏': 'pinching_hand',
  '✌️': 'v', '✌': 'v', '🤞': 'crossed_fingers', '🤟': 'love_you_gesture', '🤘': 'metal', '🤙': 'call_me',
  '👈': 'point_left', '👉': 'point_right', '👆': 'point_up_2', '🖕': 'middle_finger', '👇': 'point_down',
  '☝️': 'point_up', '☝': 'point_up', '👍': 'thumbsup', '👎': 'thumbsdown', '✊': 'fist', '👊': 'punch',
  '🤛': 'left_facing_fist', '🤜': 'right_facing_fist', '👏': 'clap', '🙌': 'raised_hands', '👐': 'open_hands',
  '🤲': 'palms_up_together', '🤝': 'handshake', '🙏': 'pray', '✍️': 'writing_hand', '✍': 'writing_hand',
  '💅': 'nail_care', '🤳': 'selfie', '💪': 'muscle', '🦾': 'mechanical_arm', '🦿': 'mechanical_leg',
  '🦵': 'leg', '🦶': 'foot', '👂': 'ear',

  // Symbols
  '❤️': 'heart', '❤': 'heart', '🧡': 'orange_heart', '💛': 'yellow_heart', '💚': 'green_heart',
  '💙': 'blue_heart', '💜': 'purple_heart', '🖤': 'black_heart', '🤍': 'white_heart', '🤎': 'brown_heart',
  '💔': 'broken_heart', '❣️': 'heavy_heart_exclamation', '💕': 'two_hearts', '💞': 'revolving_hearts',
  '💓': 'heartbeat', '💗': 'heartpulse', '💖': 'sparkling_heart', '💘': 'cupid', '💝': 'gift_heart',
  '💟': 'heart_decoration', '☮️': 'peace', '☮': 'peace', '✝️': 'cross', '✝': 'cross',
  '☪️': 'star_and_crescent', '☪': 'star_and_crescent', '🕉️': 'om', '🕉': 'om',
  '☸️': 'wheel_of_dharma', '☸': 'wheel_of_dharma', '✡️': 'star_of_david', '✡': 'star_of_david',
  '🔯': 'six_pointed_star', '🕎': 'menorah', '☯️': 'yin_yang', '☯': 'yin_yang',
  '☦️': 'orthodox_cross', '☦': 'orthodox_cross', '🛐': 'place_of_worship',
  '🛡️': 'shield', '🛡': 'shield', '⚔️': 'crossed_swords', '⚔': 'crossed_swords',
  '⚡': 'zap', '🔥': 'fire', '✨': 'sparkles', '⭐': 'star', '🌟': 'star2', '💥': 'boom',
  '💯': '100', '💢': 'anger', '🚨': 'rotating_light', '⚠️': 'warning', '⚠': 'warning',
  '⛔': 'no_entry', '🚫': 'no_entry_sign', '✅': 'white_check_mark', '❌': 'cross_mark',
  '❓': 'question', '❗': 'exclamation', '💤': 'zzz', '👑': 'crown',
  '📜': 'scroll', '🎫': 'ticket', '🔔': 'bell', '🎉': 'tada',

  // Objects
  '📱': 'iphone', '💻': 'computer', '🖥️': 'desktop', '🖥': 'desktop',
  '⌨️': 'keyboard', '⌨': 'keyboard', '🖱️': 'mouse', '🖱': 'mouse',
  '🕹️': 'joystick', '🕹': 'joystick', '💽': 'minidisc', '💾': 'floppy_disk',
  '💿': 'cd', '📀': 'dvd', '🔋': 'battery', '🔌': 'electric_plug',
  '💡': 'bulb', '🔦': 'flashlight', '🕯️': 'candle', '🕯': 'candle',
  '🧯': 'fire_extinguisher', '🗑️': 'wastebasket', '🗑': 'wastebasket',
  '🗄️': 'file_cabinet', '🗄': 'file_cabinet', '🔒': 'lock', '🔓': 'unlock',
  '🔑': 'key', '🗝️': 'old_key', '🗝': 'old_key', '🔨': 'hammer',
  '⛏️': 'pick', '⛏': 'pick', '⚒️': 'hammer_pick', '⚒': 'hammer_pick',
  '🛠️': 'tools', '🛠': 'tools', '🗡️': 'dagger', '🗡': 'dagger',
  '🔫': 'gun', '💣': 'bomb', '🧨': 'firecracker',
};

export const getUnicodeEmojiShortcode = (emoji: string): string => {
  if (UNICODE_EMOJI_NAMES[emoji]) return UNICODE_EMOJI_NAMES[emoji];
  const stripped = emoji.replace(/\uFE0F/g, '');
  if (UNICODE_EMOJI_NAMES[stripped]) return UNICODE_EMOJI_NAMES[stripped];
  return 'emoji';
};

const getCategoryIcon = (catId: string) => {
  if (catId === 'recent') return <Clock size={18} />;
  if (catId === 'smileys') return <Smile size={18} />;
  if (catId === 'gestures') return <ThumbsUp size={18} />;
  if (catId === 'symbols') return <Heart size={18} />;
  if (catId === 'objects') return <Lightbulb size={18} />;
  if (catId.includes('server')) return <Sparkles size={18} />;
  if (catId.includes('bot')) return <Bot size={18} />;
  return <Smile size={18} />;
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelect,
  customCategories = [],
  recentStorageKey = 'rng_recent_emojis',
  placeholder = 'Search emojis...',
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState<string | CustomEmoji | null>(null);
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(recentStorageKey);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const categorySectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const allCategories = useMemo<EmojiCategory[]>(() => {
    const list: EmojiCategory[] = [];
    if (recentEmojis.length > 0) {
      list.push({
        id: 'recent',
        name: 'Recent',
        emojis: recentEmojis,
      });
    }
    return [...list, ...customCategories, ...STANDARD_EMOJI_CATEGORIES];
  }, [recentEmojis, customCategories]);

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return allCategories.length > 0 ? allCategories[0].id : 'smileys';
  });

  const filteredCategories = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return allCategories;
    }
    const query = debouncedSearch.toLowerCase().replace(/:/g, '');
    return allCategories
      .map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((item) => {
          if (cat.name.toLowerCase().includes(query)) {
            return true;
          }
          if (typeof item === 'string') {
            const shortcode = UNICODE_EMOJI_NAMES[item] || '';
            return shortcode.toLowerCase().includes(query);
          }
          return item.name.toLowerCase().includes(query);
        }),
      }))
      .filter((cat) => cat.emojis.length > 0);
  }, [allCategories, debouncedSearch]);

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    const targetEl = categorySectionRefs.current[catId];
    if (targetEl && scrollContainerRef.current) {
      if (typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleEmojiClick = (emoji: string | CustomEmoji) => {
    onSelect(emoji);
    if (typeof emoji === 'string') {
      try {
        const nextRecent = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 16);
        setRecentEmojis(nextRecent);
        localStorage.setItem(recentStorageKey, JSON.stringify(nextRecent));
      } catch {
        // Ignore
      }
    }
  };

  const isCustomEmoji = (item: string | CustomEmoji): item is CustomEmoji => {
    return typeof item !== 'string' && item !== null && 'url' in item;
  };

  return (
    <div
      className={`w-[390px] h-[440px] max-w-full rounded-[8px] bg-[#2b2d31] border border-white/10 shadow-2xl flex overflow-hidden select-none ${className}`}
    >
      {/* Left Sidebar Category Rail */}
      <div className="w-12 shrink-0 bg-[#1e1f22] border-r border-white/5 flex flex-col items-center py-2.5 gap-1.5 overflow-y-auto no-scrollbar">
        {allCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-label={cat.name}
              title={cat.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleCategoryClick(cat.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {getCategoryIcon(cat.id)}
            </button>
          );
        })}
      </div>

      {/* Right Column: Search + Scrollable Grid + Preview Footer */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#2b2d31]">
        {/* Top Search Bar */}
        <div className="p-2.5 bg-[#2b2d31] border-b border-white/5 shrink-0">
          <div className="relative flex items-center">
            <Search
              size={14}
              className="absolute left-2.5 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              data-emoji-search="true"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded bg-[#1e1f22] border border-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-[#5865F2] transition-colors"
            />
            {searchTerm ? (
              <button
                type="button"
                aria-label="Clear search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSearchTerm('')}
                className="absolute right-2 text-zinc-400 hover:text-white text-xs p-0.5 cursor-pointer"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {/* Scrollable Emoji Sections */}
        <div
          ref={scrollContainerRef}
          className="flex-1 p-2.5 overflow-y-auto space-y-3.5 scroll-smooth"
          onMouseLeave={() => setHoveredEmoji(null)}
        >
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-xs gap-1.5">
              <Smile size={24} className="opacity-40" />
              <span>No emojis found</span>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div
                key={cat.id}
                ref={(el) => {
                  categorySectionRefs.current[cat.id] = el;
                }}
                className="space-y-1.5"
              >
                <div className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-0.5">
                  {cat.name}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cat.emojis.map((item, idx) => {
                    if (isCustomEmoji(item)) {
                      return (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          aria-label={`:${item.name}:`}
                          title={`:${item.name}:`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleEmojiClick(item)}
                          onMouseEnter={() => setHoveredEmoji(item)}
                          onMouseLeave={() =>
                            setHoveredEmoji((prev) => (prev === item ? null : prev))
                          }
                          className="w-9 h-9 rounded flex items-center justify-center hover:bg-white/10 active:scale-95 transition-transform cursor-pointer"
                        >
                          <Image
                            src={item.url}
                            alt={item.name}
                            width={24}
                            height={24}
                            unoptimized
                            className="w-6 h-6 object-contain"
                          />
                        </button>
                      );
                    }
                    return (
                      <button
                        key={`${item}-${idx}`}
                        type="button"
                        aria-label={item}
                        title={`:${getUnicodeEmojiShortcode(item)}:`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleEmojiClick(item)}
                        onMouseEnter={() => setHoveredEmoji(item)}
                        onMouseLeave={() =>
                          setHoveredEmoji((prev) => (prev === item ? null : prev))
                        }
                        className="w-9 h-9 rounded flex items-center justify-center text-xl hover:bg-white/10 active:scale-95 transition-transform cursor-pointer"
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Hover Preview Footer Bar */}
        <div className="h-11 shrink-0 px-3 bg-[#1e1f22] border-t border-white/5 flex items-center gap-2.5">
          {hoveredEmoji ? (
            <>
              {isCustomEmoji(hoveredEmoji) ? (
                <Image
                  src={hoveredEmoji.url}
                  alt={hoveredEmoji.name}
                  width={24}
                  height={24}
                  unoptimized
                  className="w-6 h-6 object-contain shrink-0"
                />
              ) : (
                <span className="text-2xl leading-none shrink-0">
                  {hoveredEmoji}
                </span>
              )}
              <span className="text-xs font-semibold text-white truncate font-mono">
                {isCustomEmoji(hoveredEmoji)
                  ? `:${hoveredEmoji.name}:`
                  : `:${getUnicodeEmojiShortcode(hoveredEmoji)}:`}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <Smile size={16} />
              <span>Select an emoji</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
