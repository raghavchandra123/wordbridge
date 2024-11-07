import { toast } from "@/hooks/use-toast";

type ToastVariant = "default" | "destructive";

export const handleToast = (message: string, variant: ToastVariant = "default") => {
  toast({
    description: message,
    variant,
    duration: 1000, // 1 second in milliseconds
  });
};