import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { THEME_COLORS } from "@/lib/constants";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

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
  <form onSubmit={onWordSubmit} className="flex-none">
    <div className="flex gap-2 items-center">
      <Button 
        type="button" 
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 border-2 transition-colors"
        style={{ 
          borderColor: THEME_COLORS.START,
          color: THEME_COLORS.START,
          backgroundColor: `${THEME_COLORS.START}10`
        }}
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
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 border-2 transition-colors"
        style={{ 
          borderColor: THEME_COLORS.END,
          color: THEME_COLORS.END,
          backgroundColor: `${THEME_COLORS.END}10`
        }}
        disabled={isChecking}
      >
        {isChecking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  </form>
);

export default WordInput;