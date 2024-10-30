import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const GameCard = ({ children }: { children: React.ReactNode }) => (
  <Card className="max-w-2xl mx-auto">
    <CardHeader className="space-y-0 pb-2 pt-3">
      <CardTitle className="text-lg text-center mb-0 leading-none">Word Bridge</CardTitle>
      <CardDescription className="text-center text-[10px] leading-none">
        Connect the words using similar words
      </CardDescription>
    </CardHeader>
    <CardContent className="p-4">
      {children}
    </CardContent>
  </Card>
);