import { FieldGroup } from '@windwise/ui/components/field';

import {
  CATALOG_EDIT_PRICE_SCOPE_FIELD,
  CATALOG_EDIT_PRICE_TEXT_FIELDS,
  CatalogEditSelectField,
  CatalogEditTextField,
  PRICE_SCOPE_OPTIONS,
  type CatalogEditFormStore,
} from './catalog-edit-fields';
import { CatalogEditSection } from './catalog-edit-section';

type CatalogEditPricingProps = {
  form: CatalogEditFormStore;
  disabled: boolean;
};

export function CatalogEditPricing({ form, disabled }: CatalogEditPricingProps) {
  return (
    <CatalogEditSection title="Pricing" description="Street or MSRP amounts are required before publish.">
      <FieldGroup>
        <CatalogEditSelectField
          form={form}
          field={CATALOG_EDIT_PRICE_SCOPE_FIELD}
          options={[...PRICE_SCOPE_OPTIONS]}
          disabled={disabled}
        />
        <FieldGroup className="grid sm:grid-cols-2">
          {CATALOG_EDIT_PRICE_TEXT_FIELDS.map((field) => (
            <CatalogEditTextField key={field.id} form={form} field={field} type="number" disabled={disabled} />
          ))}
        </FieldGroup>
      </FieldGroup>
    </CatalogEditSection>
  );
}
