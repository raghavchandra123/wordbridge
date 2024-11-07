import { toast } from "@/hooks/use-toast";

type ToastVariant = "default" | "destructive";

export const handleToast = (message: string, variant: ToastVariant = "default") => {
  console.log('🔔 Toast triggered:', {
    message,
    variant,
    duration: 3000,
    timestamp: new Date().toISOString()
  });

  toast({
    description: message,
    variant,
    duration: 3000,
  });
};