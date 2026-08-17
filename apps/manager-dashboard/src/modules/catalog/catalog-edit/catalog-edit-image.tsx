import { FieldGroup } from '@windwise/ui/components/field';

import {
  CATALOG_EDIT_IMAGE_TEXT_FIELDS,
  CatalogEditTextField,
  CatalogImageAttachmentField,
  type CatalogEditFormStore,
} from './catalog-edit-fields';
import { CatalogEditSection } from './catalog-edit-section';

type CatalogEditImageProps = {
  form: CatalogEditFormStore;
  disabled: boolean;
};

export function CatalogEditImage({ form, disabled }: CatalogEditImageProps) {
  return (
    <CatalogEditSection title="Primary image" description="A reachable photo and alt text are required before publish.">
      <FieldGroup>
        <CatalogImageAttachmentField form={form} disabled={disabled} />
        <FieldGroup className="grid sm:grid-cols-2">
          {CATALOG_EDIT_IMAGE_TEXT_FIELDS.map((field) => (
            <CatalogEditTextField key={field.id} form={form} field={field} disabled={disabled} />
          ))}
        </FieldGroup>
      </FieldGroup>
    </CatalogEditSection>
  );
}
