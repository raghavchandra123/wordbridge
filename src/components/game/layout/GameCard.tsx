import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const GameCard = ({ children }: { children: React.ReactNode }) => (
  <Card className="max-w-2xl mx-auto">
    <CardHeader className="py-1 space-y-0.5">
      <CardTitle className="text-xl text-center mb-0">Word Bridge</CardTitle>
      <CardDescription className="text-center text-xs">
        Connect the words using similar words
      </CardDescription>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);