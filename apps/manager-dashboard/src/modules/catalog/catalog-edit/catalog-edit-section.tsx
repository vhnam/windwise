import type { PropsWithChildren } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@windwise/ui/components/card';
import { FieldLegend, FieldSet } from '@windwise/ui/components/field';

type CatalogEditSectionProps = PropsWithChildren & {
  title: string;
  description: string;
};

export function CatalogEditSection({ title, description, children }: CatalogEditSectionProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <h2 className="text-sm font-medium">{title}</h2>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="py-4">
        <FieldSet>
          <FieldLegend className="sr-only">{title}</FieldLegend>
          {children}
        </FieldSet>
      </CardContent>
    </Card>
  );
}
