import { toast } from "@/components/ui/use-toast";

type ToastVariant = "default" | "destructive";

export const handleToast = (message: string, variant: ToastVariant = "default") => {
  toast({
    description: message,
    variant,
    duration: 3000,
  });
};