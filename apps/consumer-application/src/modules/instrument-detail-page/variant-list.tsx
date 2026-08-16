import { Link } from '@tanstack/react-router';

import { Card, CardDescription, CardHeader, CardTitle } from '@windwise/ui/components/card';

export type VariantListItem = {
  modelId: string;
  displayName: string;
  distinguishingFeature: string;
};

export type VariantListProps = {
  variants: VariantListItem[];
};

function VariantList({ variants }: VariantListProps) {
  if (variants.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-3">
      {variants.map((variant) => (
        <li key={variant.modelId}>
          <Link
            to="/instrument/$modelId"
            params={{ modelId: variant.modelId }}
            className="group/variant-link block cursor-pointer rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Card
              size="sm"
              className="bg-card/80 backdrop-blur-md transition-[box-shadow,background-color] duration-200 group-hover/variant-link:bg-card group-hover/variant-link:shadow-md group-focus-visible/variant-link:bg-card group-focus-visible/variant-link:shadow-md"
            >
              <CardHeader className="gap-1">
                <CardTitle className="text-sm">{variant.displayName}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{variant.distinguishingFeature}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export { VariantList };
