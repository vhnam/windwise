import { FieldGroup } from '@windwise/ui/components/field';

import {
  CATALOG_EDIT_BRAND_FIELD,
  CATALOG_EDIT_FAMILY_FIELD,
  CATALOG_EDIT_IDENTITY_TEXT_FIELDS,
  CatalogEditSelectField,
  CatalogEditTextField,
  type CatalogEditFormStore,
} from './catalog-edit-fields';
import { CatalogEditSection } from './catalog-edit-section';

type CatalogEditIdentityProps = {
  form: CatalogEditFormStore;
  families: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  disabled: boolean;
  isFamiliesPending: boolean;
  isFamiliesError: boolean;
  isBrandsPending: boolean;
  isBrandsError: boolean;
};

export function CatalogEditIdentity({
  form,
  families,
  brands,
  disabled,
  isFamiliesPending,
  isFamiliesError,
  isBrandsPending,
  isBrandsError,
}: CatalogEditIdentityProps) {
  return (
    <CatalogEditSection title="Identity" description="Required to create a draft.">
      <FieldGroup className="grid sm:grid-cols-2">
        <CatalogEditSelectField
          form={form}
          field={CATALOG_EDIT_FAMILY_FIELD}
          options={families}
          disabled={disabled}
          isPending={isFamiliesPending}
          isError={isFamiliesError}
          loadError="Could not load families."
        />
        <CatalogEditSelectField
          form={form}
          field={CATALOG_EDIT_BRAND_FIELD}
          options={brands}
          disabled={disabled}
          isPending={isBrandsPending}
          isError={isBrandsError}
          loadError="Could not load brands."
        />
        {CATALOG_EDIT_IDENTITY_TEXT_FIELDS.map((field) => (
          <CatalogEditTextField key={field.id} form={form} field={field} disabled={disabled} />
        ))}
      </FieldGroup>
    </CatalogEditSection>
  );
}
