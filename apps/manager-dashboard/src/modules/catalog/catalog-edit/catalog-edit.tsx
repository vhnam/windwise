import { Form, getDeepErrorEntries, handleSubmit as submitValidatedForm, useForm } from '@formisch/react';
import { useEffect, useRef } from 'react';

import { CatalogEditSchema } from '#/schemas/catalog-edit.schema';
import { fieldErrorMessage } from '#/utils/auth';

import { CatalogEditErrors } from './catalog-edit-errors';
import { CatalogEditHeader } from './catalog-edit-header';
import { CatalogEditIdentity } from './catalog-edit-identity';
import { CatalogEditImage } from './catalog-edit-image';
import { CatalogEditPricing } from './catalog-edit-pricing';
import { CatalogEditSidebar } from './catalog-edit-sidebar';
import { CatalogEditSource } from './catalog-edit-source';
import { useCatalogEditActions } from './catalog-edit.actions';

function CatalogEdit() {
  const {
    record,
    isNew,
    actionError,
    missingFields,
    brands,
    families,
    isBrandsPending,
    isFamiliesPending,
    isBrandsError,
    isFamiliesError,
    submitSave,
    handleTransition,
  } = useCatalogEditActions();
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const catalogEditForm = useForm({
    schema: CatalogEditSchema,
    initialInput: {
      brandId: record?.brandId ?? '',
      familyId: record?.familyId ?? '',
      modelCode: record?.modelCode ?? '',
      displayName: record?.displayName ?? '',
      priceScope: record?.price?.scope ?? '',
      priceAmountMin: record?.price ? String(record.price.amountMin) : '',
      priceAmountMax: record?.price ? String(record.price.amountMax) : '',
      imageUrl: record?.primaryImage?.url ?? '',
      imageAltEn: record?.primaryImage?.altEn ?? '',
      imageCredit: record?.primaryImage?.credit ?? '',
      sourceKind: record?.source?.kind ?? '',
      sourceUrl: record?.source?.url ?? '',
      sourcePublisher: record?.source?.publisher ?? '',
    },
  });

  const isSubmitting = catalogEditForm.isSubmitting;
  const formError = fieldErrorMessage(catalogEditForm.errors);
  const errorEntries =
    catalogEditForm.isSubmitted && !catalogEditForm.isValid ? getDeepErrorEntries(catalogEditForm) : [];

  useEffect(() => {
    if (formError || actionError || missingFields.length > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [actionError, formError, missingFields]);

  const onFormSubmit = async (payload: Parameters<typeof submitSave>[0]) => {
    await submitSave(payload);
  };

  const onTransition = (targetStatus: 'in_review' | 'published' | 'draft' | 'archived') => {
    void submitValidatedForm(catalogEditForm, async (payload) => {
      await handleTransition(targetStatus, payload);
    })();
  };

  return (
    <div className="-mx-4 flex min-h-full flex-col">
      <Form of={catalogEditForm} className="flex min-h-full flex-col" aria-busy={isSubmitting} onSubmit={onFormSubmit}>
        <CatalogEditHeader record={record} isNew={isNew} isSubmitting={isSubmitting} onTransition={onTransition} />

        <div className="grid flex-1 gap-6 px-4 lg:px-6 py-6 lg:py-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="space-y-4 lg:space-y-6">
            <CatalogEditErrors
              formError={formError}
              actionError={actionError}
              missingFields={missingFields}
              errorEntries={errorEntries}
              errorSummaryRef={errorSummaryRef}
            />
            <CatalogEditIdentity
              form={catalogEditForm}
              families={families}
              brands={brands}
              disabled={isSubmitting}
              isFamiliesPending={isFamiliesPending}
              isFamiliesError={isFamiliesError}
              isBrandsPending={isBrandsPending}
              isBrandsError={isBrandsError}
            />
            <CatalogEditPricing form={catalogEditForm} disabled={isSubmitting} />
            <CatalogEditImage form={catalogEditForm} disabled={isSubmitting} />
            <CatalogEditSource form={catalogEditForm} disabled={isSubmitting} />
          </div>

          <CatalogEditSidebar record={record} isSubmitting={isSubmitting} onTransition={onTransition} />
        </div>
      </Form>
    </div>
  );
}

export default CatalogEdit;
