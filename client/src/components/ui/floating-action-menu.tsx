import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Plus, X } from "lucide-react";

interface FloatingActionMenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface FloatingActionMenuProps {
  items: FloatingActionMenuItem[];
  className?: string;
}

export function FloatingActionMenu({ items, className }: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.9,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.8
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={menuVariants}
              className="absolute bottom-16 right-0 flex flex-col-reverse gap-2 min-w-[200px]"
            >
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex justify-end"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 
                             border border-gray-200 shadow-lg hover:bg-white/95 
                             flex items-center gap-2 px-4 py-6 w-full"
                    onClick={() => {
                      item.onClick();
                      setIsOpen(false);
                    }}
                  >
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.icon}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <Button
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg",
            isOpen ? "bg-gray-900 hover:bg-gray-800" : "bg-black hover:bg-gray-900"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}