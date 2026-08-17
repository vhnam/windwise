import type { PropsWithChildren } from 'react';

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@windwise/ui/components/card';

type AuthScreenProps = PropsWithChildren & {
  title: string;
  description: string;
};

export function AuthScreen({ title, description, children }: AuthScreenProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-heading text-lg font-medium text-card-foreground">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
