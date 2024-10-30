import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { THEME_COLORS } from "@/lib/constants";

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
    <div className="flex gap-1.5">
      <Button 
        type="submit" 
        className="flex-1 h-10 text-white hover:opacity-90"
        style={{ backgroundColor: THEME_COLORS.GRADIENT.MID2 }}
        disabled={isChecking}
      >
        {isChecking ? "Checking..." : (editingIndex !== null ? "Update Word" : "Submit Word")}
      </Button>
      {editingIndex !== null && (
        <Button 
          type="button" 
          variant="outline"
          className="h-10 hover:opacity-90"
          style={{ borderColor: THEME_COLORS.GRADIENT.MID2, color: THEME_COLORS.GRADIENT.MID2 }}
          disabled={isChecking}
          onClick={onEditCancel}
        >
          Add New Word
        </Button>
      )}
    </div>
  </form>
);

export default WordInput;