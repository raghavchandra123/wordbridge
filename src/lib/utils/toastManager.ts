import { toast } from "@/hooks/use-toast";

type ToastVariant = "default" | "destructive";

export const handleToast = (message: string, variant: ToastVariant = "default") => {
  toast({
    description: message,
    variant,
    duration: 3000, // Set default duration to 3 seconds
  });
};