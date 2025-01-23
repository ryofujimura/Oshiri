import { FC } from "react";
import * as Icons from "lucide-react";
import { HelpCircle } from "lucide-react";
import { LucideProps } from 'lucide-react';

type IconProps = {
  name: keyof typeof Icons;
  className?: string;
  size?: number;
};

export const IconFallback: FC<IconProps> = ({ name, className, size = 24 }) => {
  try {
    // Try to get the icon from lucide-react
    const IconComponent = Icons[name] as FC<LucideProps>;

    // If the icon exists, render it
    if (IconComponent) {
      return <IconComponent className={className} size={size} />;
    }

    // If icon doesn't exist, log a warning and return fallback
    console.warn(`Icon "${name}" not found, using fallback icon`);
    return <HelpCircle className={className} size={size} />;
  } catch (error) {
    // In case of any errors, log them and return fallback
    console.error(`Error loading icon "${name}":`, error);
    return <HelpCircle className={className} size={size} />;
  }
};

// Helper function to check if an icon exists
export function doesIconExist(name: string): name is keyof typeof Icons {
  return name in Icons;
}