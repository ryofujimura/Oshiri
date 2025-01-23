import { FC } from "react";
import * as Icons from "lucide-react";
import { HelpCircle } from "lucide-react";
import { LucideProps } from 'lucide-react';

// Mapping of icon names to emoji fallbacks
const EMOJI_FALLBACKS: Record<string, string> = {
  Search: "🔍",
  MapPin: "📍",
  Star: "⭐",
  Power: "🔌",
  Users: "👥",
  Sofa: "🪑",
  Chair: "🪑",
  ArrowRight: "➡️",
  Home: "🏠",
  Settings: "⚙️",
  User: "👤",
  Bell: "🔔",
  Heart: "❤️",
  Phone: "📱",
  Mail: "📧",
  Calendar: "📅",
  Clock: "⏰",
  Image: "🖼️",
  File: "📄",
  Folder: "📁",
  Link: "🔗",
  Eye: "👁️",
  Lock: "🔒",
  Unlock: "🔓",
  Warning: "⚠️",
  Info: "ℹ️",
  Check: "✅",
  X: "❌",
  Plus: "➕",
  Minus: "➖",
};

type IconProps = {
  name: keyof typeof Icons;
  className?: string;
  size?: number;
  showFallback?: boolean; // If true, always shows emoji fallback
};

type IconFallbackComponentProps = IconProps & {
  emoji: string;
};

// Component to render emoji fallback
const EmojiComponent: FC<{ emoji: string; className?: string }> = ({ 
  emoji, 
  className 
}) => (
  <span className={className} role="img" aria-label={emoji}>
    {emoji}
  </span>
);

// Component to render Lucide icon with emoji fallback
export const IconFallback: FC<IconProps> = ({ 
  name, 
  className, 
  size = 24, 
  showFallback = false 
}) => {
  try {
    // If showFallback is true or the icon name has an emoji mapping, show the emoji
    if (showFallback || !Icons[name]) {
      const emoji = EMOJI_FALLBACKS[name] || "❓";
      return <EmojiComponent emoji={emoji} className={className} />;
    }

    // Try to get the icon from lucide-react
    const IconComponent = Icons[name] as FC<LucideProps>;

    // If the icon exists, render it
    return <IconComponent className={className} size={size} />;
  } catch (error) {
    // In case of any errors, log them and return fallback emoji
    console.error(`Error loading icon "${name}":`, error);
    const emoji = EMOJI_FALLBACKS[name] || "❓";
    return <EmojiComponent emoji={emoji} className={className} />;
  }
};

// Helper function to check if an icon exists
export function doesIconExist(name: string): name is keyof typeof Icons {
  return name in Icons;
}

// Helper function to get emoji fallback for an icon
export function getIconFallback(name: string): string {
  return EMOJI_FALLBACKS[name] || "❓";
}