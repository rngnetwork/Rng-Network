'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';

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
  '☠️': 'skull_crossbones', '💩': 'poop', '🤡': 'clown', '👹': 'japanese_ogre', '👺': 'japanese_goblin',
  '👻': 'ghost', '👽': 'alien', '👾': 'space_invader', '🤖': 'robot',
  '👋': 'wave', '🤚': 'raised_back_of_hand', '🖐️': 'raised_hand_with_fingers_splayed', '✋': 'hand', '🖖': 'vulcan',
  '👌': 'ok_hand', '🤌': 'pinched_fingers', '🤏': 'pinching_hand', '✌️': 'v', '🤞': 'crossed_fingers',
  '🤟': 'love_you_gesture', '🤘': 'metal', '🤙': 'call_me', '👈': 'point_left', '👉': 'point_right',
  '👆': 'point_up_2', '🖕': 'middle_finger', '👇': 'point_down', '☝️': 'point_up', '👍': 'thumbsup',
  '👎': 'thumbsdown', '✊': 'fist', '👊': 'punch', '🤛': 'left_facing_fist', '🤜': 'right_facing_fist',
  '👏': 'clap', '🙌': 'raised_hands', '👐': 'open_hands', '🤲': 'palms_up_together', '🤝': 'handshake',
  '🙏': 'pray', '✍️': 'writing_hand', '💅': 'nail_care', '🤳': 'selfie', '💪': 'muscle',
  '❤️': 'heart', '🧡': 'orange_heart', '💛': 'yellow_heart', '💚': 'green_heart', '💙': 'blue_heart',
  '💜': 'purple_heart', '🖤': 'black_heart', '🤍': 'white_heart', '🤎': 'brown_heart', '💔': 'broken_heart',
  '🛡️': 'shield', '⚔️': 'crossed_swords', '⚡': 'zap', '🔥': 'fire', '✨': 'sparkles',
  '⭐': 'star', '🌟': 'star2', '💥': 'boom', '💯': '100', '💢': 'anger',
  '🚨': 'rotating_light', '⚠️': 'warning', '⛔': 'no_entry', '🚫': 'no_entry_sign',
  '✅': 'white_check_mark', '❌': 'cross_mark', '❓': 'question', '❗': 'exclamation', '💤': 'zzz', '👑': 'crown',
  '📜': 'scroll', '🎫': 'ticket', '🔔': 'bell', '🎉': 'tada',
};

export const getUnicodeEmojiShortcode = (emoji: string): string => {
  return UNICODE_EMOJI_NAMES[emoji] || 'emoji';
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

  const [activeTab, setActiveTab] = useState<string>('all');
  const currentTab = activeTab === 'all' && allCategories.length > 0 ? allCategories[0].id : activeTab;

  const filteredCategories = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return allCategories;
    }
    const query = debouncedSearch.toLowerCase().replace(/:/g, '');
    return allCategories
      .map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((item) => {
          if (typeof item === 'string') {
            return true;
          }
          return item.name.toLowerCase().includes(query);
        }),
      }))
      .filter((cat) => cat.emojis.length > 0);
  }, [allCategories, debouncedSearch]);

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
      className={`w-80 max-w-full rounded-apple-xl bg-[#1e1f22] border border-surface-border shadow-elevated flex flex-col overflow-hidden ${className}`}
    >
      <div className="p-2 border-b border-surface-border/60">
        <div className="relative">
          <input
            type="text"
            data-emoji-search="true"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full px-2.5 py-1 text-xs rounded-apple-sm bg-surface-canvas border border-surface-border text-text-primary placeholder:text-text-tertiary outline-none focus:border-brand-red"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary text-xs"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {!debouncedSearch ? (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-surface-border/40 overflow-x-auto no-scrollbar">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded-apple-sm whitespace-nowrap transition-colors ${
                currentTab === cat.id
                  ? 'bg-brand-red text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.06]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="p-2 max-h-56 overflow-y-auto flex flex-col gap-3"
        onMouseLeave={() => setHoveredEmoji(null)}
      >
        {filteredCategories.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-tertiary">No emojis found</div>
        ) : (
          filteredCategories
            .filter((cat) => (debouncedSearch ? true : cat.id === currentTab))
            .map((cat) => (
              <div key={cat.id} className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">
                  {cat.name}
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {cat.emojis.map((item, idx) => {
                    if (isCustomEmoji(item)) {
                      return (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={() => handleEmojiClick(item)}
                          onMouseEnter={() => setHoveredEmoji(item)}
                          onMouseLeave={() =>
                            setHoveredEmoji((prev) => (prev === item ? null : prev))
                          }
                          title={`:${item.name}:`}
                          className="w-8 h-8 rounded-apple-sm flex items-center justify-center hover:bg-white/10 transition-transform active:scale-90"
                        >
                          <Image
                            src={item.url}
                            alt={item.name}
                            width={20}
                            height={20}
                            unoptimized
                            className="w-5 h-5 object-contain"
                          />
                        </button>
                      );
                    }
                    return (
                      <button
                        key={`${item}-${idx}`}
                        type="button"
                        onClick={() => handleEmojiClick(item)}
                        onMouseEnter={() => setHoveredEmoji(item)}
                        onMouseLeave={() =>
                          setHoveredEmoji((prev) => (prev === item ? null : prev))
                        }
                        className="w-8 h-8 rounded-apple-sm flex items-center justify-center text-lg hover:bg-white/10 transition-transform active:scale-90"
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

      {/* Bottom Hover Preview Bar (Discord style) */}
      <div className="px-3 py-2 border-t border-surface-border/60 bg-surface-canvas/90 flex items-center gap-2.5 min-h-[44px]">
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
              <span className="text-xl leading-none shrink-0">{hoveredEmoji}</span>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {isCustomEmoji(hoveredEmoji)
                  ? `:${hoveredEmoji.name}:`
                  : `:${getUnicodeEmojiShortcode(hoveredEmoji)}:`}
              </span>
            </div>
          </>
        ) : (
          <span className="text-xs text-text-tertiary select-none">Select an emoji</span>
        )}
      </div>
    </div>
  );
};
