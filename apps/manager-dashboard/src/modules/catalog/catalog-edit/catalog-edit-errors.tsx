import { AlertCircleIcon } from 'lucide-react';
import type { RefObject } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@windwise/ui/components/alert';

import { CATALOG_EDIT_FIELDS, PUBLISH_FIELD_ANCHORS } from './catalog-edit-fields';

type CatalogEditErrorsProps = {
  formError: string | undefined;
  actionError: string | null;
  missingFields: string[];
  errorEntries: ReadonlyArray<{ path: readonly PropertyKey[]; errors: readonly string[] }>;
  errorSummaryRef: RefObject<HTMLDivElement | null>;
};

export function CatalogEditErrors({
  formError,
  actionError,
  missingFields,
  errorEntries,
  errorSummaryRef,
}: CatalogEditErrorsProps) {
  if (!formError && !actionError && errorEntries.length === 0 && missingFields.length === 0) {
    return null;
  }

  return (
    <Alert
      ref={errorSummaryRef}
      tabIndex={-1}
      variant="destructive"
      aria-labelledby="catalog-edit-error-title"
      className="outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
    >
      <AlertCircleIcon aria-hidden="true" />
      <AlertTitle id="catalog-edit-error-title">There is a problem</AlertTitle>
      <AlertDescription>
        {formError ? (
          <p>{formError}</p>
        ) : missingFields.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4">
            {missingFields.map((field) => {
              const anchor = PUBLISH_FIELD_ANCHORS[field];
              if (!anchor) {
                return <li key={field}>{field}</li>;
              }
              return (
                <li key={field}>
                  <a href={`#${anchor.id}`} className="underline underline-offset-3">
                    Add a {anchor.label}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : actionError ? (
          <p>{actionError}</p>
        ) : (
          <ul className="list-disc space-y-1 pl-4">
            {errorEntries.map((entry) => {
              const field = CATALOG_EDIT_FIELDS.find((item) => item.path[0] === entry.path[0]);
              if (!field) {
                return <li key={entry.errors[0]}>{entry.errors[0]}</li>;
              }
              return (
                <li key={field.id}>
                  <a href={`#${field.id}`} className="underline underline-offset-3">
                    {entry.errors[0]}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
