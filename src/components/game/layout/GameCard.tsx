import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const GameCard = ({ children }: { children: React.ReactNode }) => (
  <Card className="max-w-2xl mx-auto">
    <CardHeader className="py-2">
      <CardTitle className="text-2xl text-center mb-0">Word Bridge</CardTitle>
      <CardDescription className="text-center text-sm">
        Connect the words using similar words
      </CardDescription>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);