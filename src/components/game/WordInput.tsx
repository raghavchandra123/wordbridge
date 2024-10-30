import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { THEME_COLORS } from "@/lib/constants";
import { ArrowLeft, Send } from "lucide-react";

interface WordInputProps {
  currentWord: string;
  onWordChange: (word: string) => void;
  onWordSubmit: (e: React.FormEvent) => void;
  editingIndex: number | null;
  isChecking: boolean;
  onEditCancel: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const WordInput = ({ 
  currentWord, 
  onWordChange, 
  onWordSubmit, 
  editingIndex, 
  isChecking,
  onEditCancel,
  inputRef 
}: WordInputProps) => (
  <form onSubmit={onWordSubmit} className="flex-none space-y-1">
    <div className="flex gap-2 items-center">
      <Button 
        type="button" 
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0"
        style={{ color: THEME_COLORS.GRADIENT.MID2 }}
        disabled={isChecking}
        onClick={onEditCancel}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <Input
        ref={inputRef}
        value={currentWord}
        onChange={(e) => onWordChange(e.target.value.toLowerCase())}
        placeholder={editingIndex !== null ? `Change word #${editingIndex + 1}` : "Enter a word..."}
        className="text-center text-lg h-10"
        style={{ 
          backgroundColor: `${THEME_COLORS.GRADIENT.MID2}33`,
          borderColor: THEME_COLORS.GRADIENT.MID2
        }}
        readOnly={false}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />

      <Button 
        type="submit" 
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0"
        style={{ color: THEME_COLORS.GRADIENT.MID2 }}
        disabled={isChecking}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  </form>
);

export default WordInput;