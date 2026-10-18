"use client";

import React, { useState, useMemo, useDeferredValue } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sliders,
  Sparkles,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Gavel,
  Volume2,
  UserPlus,
  Ticket,
  Zap,
  Coins,
  FileText,
  BadgeCheck,
  Gift,
  Briefcase
} from 'lucide-react';
import { BotModule, ModuleCategory } from './types';
import { Toggle } from '@/components/ui/Toggle';

// Dynamic icon mapper for reliable visual rendering
const ICON_MAP: Record<string, React.ElementType> = {
  ShieldAlert,
  ShieldCheck,
  Gavel,
  Volume2,
  UserPlus,
  Ticket,
  Zap,
  Coins,
  FileText,
  BadgeCheck,
  Gift,
  Briefcase,
};

interface ModuleGridProps {
  modules: BotModule[];
  onSelectModule: (moduleId: string) => void;
  onToggleModule: (moduleId: string, enabled: boolean) => void;
  isUpdatingModuleId?: string | null;
}

const CATEGORIES: { id: ModuleCategory; label: string }[] = [
  { id: 'all', label: 'All Modules' },
  { id: 'security', label: 'Security' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'utility', label: 'Utility' },
  { id: 'economy', label: 'Economy' },
];

const ITEMS_PER_PAGE = 8; // 2 rows of 4 cards on desktop

export function ModuleGrid({
  modules,
  onSelectModule,
  onToggleModule,
  isUpdatingModuleId = null,
}: ModuleGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Non-blocking deferred query for ultra-smooth typing
  const deferredQuery = useDeferredValue(searchQuery);

  // Filter modules by search and category
  const filteredModules = useMemo(() => {
    const q = deferredQuery.toLowerCase().trim();
    return modules.filter((mod) => {
      // Category filter
      if (selectedCategory !== 'all' && mod.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (q) {
        const matchesName = mod.name.toLowerCase().includes(q);
        const matchesDesc = mod.description.toLowerCase().includes(q);
        const matchesTags = mod.tags.some((t) => t.toLowerCase().includes(q));
        return matchesName || matchesDesc || matchesTags;
      }

      return true;
    });
  }, [modules, selectedCategory, deferredQuery]);

  // Reset pagination when search or category changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: ModuleCategory) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredModules.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedModules = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredModules.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredModules, safeCurrentPage]);

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full">
      {/* TOP BAR: Search & Category Pills */}
      <div className="flex flex-col gap-4">
        {/* Pixel-perfect Search Bar with Fixed Center Icon */}
        <div className="relative w-full">
          {/* Centered Left Search Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 flex items-center justify-center z-10">
            <Search size={18} className="text-zinc-400" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search bot modules by name, description, or feature tag..."
            className="w-full py-3.5 pl-11 pr-24 rounded-2xl bg-[#0d0e12] border border-white/10 hover:border-white/20 focus:border-red-500 focus:shadow-[0_0_20px_rgba(225,29,46,0.25)] text-white text-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-500 font-medium"
          />

          {/* Right Side Tools: Clear button and matching module count */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}

            <div className="hidden sm:flex items-center text-xs text-zinc-500 font-mono pr-1">
              {filteredModules.length} {filteredModules.length === 1 ? 'module' : 'modules'}
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-150 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#E11D2E] to-[#991B1B] text-white border-red-500/50 shadow-[0_0_12px_rgba(225,29,46,0.35)]'
                    : 'bg-[#0d0e12] text-zinc-400 border-white/5 hover:text-white hover:border-white/10 hover:bg-white/[0.04]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODULE GRID: 4 columns on desktop, 1 column on phone */}
      {paginatedModules.length === 0 ? (
        <div className="py-20 px-4 rounded-3xl bg-[#0d0e12] border border-white/5 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_15px_rgba(225,29,46,0.15)]">
            <Sliders size={26} />
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">No modules found</h3>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-sm">
            No bot modules matched your search term &quot;{searchQuery}&quot;. Try clearing filters to see all available systems.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-5 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {paginatedModules.map((mod) => {
            const IconComp = ICON_MAP[mod.icon] || Sparkles;
            const isUpdating = isUpdatingModuleId === mod.id;

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`group relative rounded-2xl md:rounded-3xl border transition-[border-color,box-shadow,opacity] duration-200 flex flex-col justify-between p-5 md:p-5.5 transform-gpu ${
                  mod.enabled
                    ? 'bg-[#0e0f13] border-white/10 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(225,29,46,0.18)]'
                    : 'bg-[#0a0a0d] border-white/5 opacity-75 hover:opacity-100 hover:border-white/15'
                }`}
              >
                {/* TOP: Icon, Badges, and Master Toggle */}
                <div className="flex flex-col gap-4 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-200 ${
                        mod.enabled
                          ? 'bg-red-500/15 border-red-500/35 text-red-400 shadow-[0_0_12px_rgba(225,29,46,0.25)] group-hover:scale-105'
                          : 'bg-zinc-900 border-white/5 text-zinc-500'
                      }`}
                    >
                      <IconComp size={24} />
                    </div>

                    {/* Master Quick Toggle */}
                    <div className="shrink-0 pt-1">
                      <Toggle
                        checked={mod.enabled}
                        disabled={isUpdating}
                        onChange={(enabled) => onToggleModule(mod.id, enabled)}
                      />
                    </div>
                  </div>

                  {/* Title & Badges */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-white tracking-tight group-hover:text-red-100 transition-colors">
                        {mod.name}
                      </h4>

                      {mod.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-semibold">
                          {mod.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </div>

                {/* BOTTOM: Submodule Count & Configure CTA */}
                <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between gap-2 relative z-10">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                    <Layers size={13} className="text-red-400/80" />
                    <span>{mod.submoduleCount} submodules</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectModule(mod.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-xs font-semibold text-zinc-200 hover:text-white transition-colors group/btn cursor-pointer"
                  >
                    <span>Configure</span>
                    <ArrowRight
                      size={13}
                      className="text-zinc-400 group-hover/btn:text-red-300 group-hover/btn:translate-x-0.5 transition-transform"
                    />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* COMPACT CENTERED PAGINATION: < 1 > with Red Arrow Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2.5 pt-6 mt-4 border-t border-white/10">
          {/* Previous Red Button */}
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#E11D2E] to-[#8A0F1A] hover:from-[#FF3B4D] hover:to-[#B91C1C] active:scale-95 text-white shadow-[0_0_12px_rgba(225,29,46,0.35)] hover:shadow-[0_0_20px_rgba(225,29,46,0.6)] disabled:opacity-25 disabled:pointer-events-none disabled:shadow-none flex items-center justify-center transition-all cursor-pointer shrink-0 border border-red-500/30"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Compact Page Number Display */}
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d0e12] border border-white/10 text-xs font-mono select-none">
            <span className="text-white font-bold text-sm">{safeCurrentPage}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{totalPages}</span>
          </div>

          {/* Next Red Button */}
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#E11D2E] to-[#8A0F1A] hover:from-[#FF3B4D] hover:to-[#B91C1C] active:scale-95 text-white shadow-[0_0_12px_rgba(225,29,46,0.35)] hover:shadow-[0_0_20px_rgba(225,29,46,0.6)] disabled:opacity-25 disabled:pointer-events-none disabled:shadow-none flex items-center justify-center transition-all cursor-pointer shrink-0 border border-red-500/30"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
