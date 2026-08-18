import { FieldGroup } from '@windwise/ui/components/field';

import {
  CATALOG_EDIT_SOURCE_KIND_FIELD,
  CATALOG_EDIT_SOURCE_TEXT_FIELDS,
  CatalogEditSelectField,
  CatalogEditTextField,
  SOURCE_KIND_OPTIONS,
  type CatalogEditFormStore,
} from './catalog-edit-fields';
import { CatalogEditSection } from './catalog-edit-section';

type CatalogEditSourceProps = {
  form: CatalogEditFormStore;
  disabled: boolean;
};

export function CatalogEditSource({ form, disabled }: CatalogEditSourceProps) {
  return (
    <CatalogEditSection title="Source" description="Where this record was verified. Required before publish.">
      <FieldGroup>
        <CatalogEditSelectField
          form={form}
          field={CATALOG_EDIT_SOURCE_KIND_FIELD}
          options={[...SOURCE_KIND_OPTIONS]}
          disabled={disabled}
        />
        {CATALOG_EDIT_SOURCE_TEXT_FIELDS.map((field) => (
          <CatalogEditTextField
            key={field.id}
            form={form}
            field={field}
            type={field.path[0] === 'sourceUrl' ? 'url' : 'text'}
            disabled={disabled}
          />
        ))}
      </FieldGroup>
    </CatalogEditSection>
  );
}
