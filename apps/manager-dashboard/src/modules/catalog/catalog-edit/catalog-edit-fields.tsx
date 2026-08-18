import { Field as FormischField, type FormStore } from '@formisch/react';
import { Loader2Icon, PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { PriceScopeFilters, SourceKindFilters } from '@windwise/schemas';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@windwise/ui/components/attachment';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@windwise/ui/components/field';
import { Input } from '@windwise/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@windwise/ui/components/select';

import { CatalogEditSchema } from '#/schemas/catalog-edit.schema';
import { fieldErrorMessage } from '#/utils/auth';

export const PRICE_SCOPE_OPTIONS = [
  { id: 'vn_street', name: 'Vietnam street' },
  { id: 'msrp_global', name: 'Global MSRP' },
] as const satisfies ReadonlyArray<{ id: (typeof PriceScopeFilters)[number]; name: string }>;

export const SOURCE_KIND_OPTIONS = [
  { id: 'manufacturer', name: 'Manufacturer' },
  { id: 'dealer', name: 'Dealer' },
  { id: 'manual_pdf', name: 'Manual PDF' },
  { id: 'editorial', name: 'Editorial' },
  { id: 'expert_review', name: 'Expert review' },
] as const satisfies ReadonlyArray<{ id: (typeof SourceKindFilters)[number]; name: string }>;

export const CATALOG_EDIT_FIELDS = [
  {
    path: ['familyId'],
    id: 'family-id',
    label: 'Family',
    description: 'The instrument family, such as clarinet or trumpet.',
    placeholder: 'Select a family',
  },
  {
    path: ['brandId'],
    id: 'brand-id',
    label: 'Brand',
    description: 'The manufacturer this instrument belongs to.',
    placeholder: 'Select a brand',
  },
  {
    path: ['modelCode'],
    id: 'model-code',
    label: 'Model code',
    description: 'The manufacturer’s model code, as it appears in source material.',
    placeholder: 'YTR-2330',
  },
  {
    path: ['displayName'],
    id: 'display-name',
    label: 'Display name',
    description: 'The name staff and members will see in the catalog.',
    placeholder: 'Yamaha YTR-2330',
  },
  {
    path: ['priceScope'],
    id: 'price-scope',
    label: 'Price scope',
    description: 'Required before publish. Street price in Vietnam, or global MSRP.',
    placeholder: 'Select a price scope',
  },
  {
    path: ['priceAmountMin'],
    id: 'price-amount-min',
    label: 'Price (min)',
    description: 'Lowest current amount for this scope. Required before publish.',
    placeholder: '18500000',
  },
  {
    path: ['priceAmountMax'],
    id: 'price-amount-max',
    label: 'Price (max)',
    description: 'Highest current amount. Leave blank to use the minimum.',
    placeholder: '21000000',
    optional: true,
  },
  {
    path: ['imageUrl'],
    id: 'image-url',
    label: 'Primary image',
    description: 'Required before publish. Upload a photo, or paste a publicly reachable image URL.',
    placeholder: 'https://example.com/yamaha-ytr-2330.jpg',
  },
  {
    path: ['imageAltEn'],
    id: 'image-alt-en',
    label: 'Image alt text',
    description: 'Describe the photo for accessibility. Required before publish.',
    placeholder: 'Yamaha YTR-2330 trumpet, front view',
  },
  {
    path: ['imageCredit'],
    id: 'image-credit',
    label: 'Image credit',
    description: 'Who provided or owns the photo.',
    placeholder: 'Yamaha Corporation',
    optional: true,
  },
  {
    path: ['sourceKind'],
    id: 'source-kind',
    label: 'Source kind',
    description: 'Required before publish. Where this record was verified.',
    placeholder: 'Select a source kind',
  },
  {
    path: ['sourceUrl'],
    id: 'source-url',
    label: 'Source URL',
    description: 'Required before publish. The page or document used to verify this record.',
    placeholder: 'https://usa.yamaha.com/products/musical_instruments/winds/',
  },
  {
    path: ['sourcePublisher'],
    id: 'source-publisher',
    label: 'Source publisher',
    description: 'The publisher or site name for this source.',
    placeholder: 'Yamaha',
  },
] as const;

export const CATALOG_EDIT_BRAND_FIELD = CATALOG_EDIT_FIELDS.find((field) => field.path[0] === 'brandId')!;
export const CATALOG_EDIT_FAMILY_FIELD = CATALOG_EDIT_FIELDS.find((field) => field.path[0] === 'familyId')!;
export const CATALOG_EDIT_PRICE_SCOPE_FIELD = CATALOG_EDIT_FIELDS.find((field) => field.path[0] === 'priceScope')!;
export const CATALOG_EDIT_SOURCE_KIND_FIELD = CATALOG_EDIT_FIELDS.find((field) => field.path[0] === 'sourceKind')!;

export const CATALOG_EDIT_IDENTITY_TEXT_FIELDS = CATALOG_EDIT_FIELDS.filter(
  (field) => field.path[0] === 'modelCode' || field.path[0] === 'displayName',
);
export const CATALOG_EDIT_PRICE_TEXT_FIELDS = CATALOG_EDIT_FIELDS.filter(
  (field) => field.path[0] === 'priceAmountMin' || field.path[0] === 'priceAmountMax',
);
export const CATALOG_EDIT_IMAGE_URL_FIELD = CATALOG_EDIT_FIELDS.find((field) => field.path[0] === 'imageUrl')!;
export const CATALOG_EDIT_IMAGE_TEXT_FIELDS = CATALOG_EDIT_FIELDS.filter(
  (field) => field.path[0] === 'imageAltEn' || field.path[0] === 'imageCredit',
);
export const CATALOG_EDIT_SOURCE_TEXT_FIELDS = CATALOG_EDIT_FIELDS.filter(
  (field) => field.path[0] === 'sourceUrl' || field.path[0] === 'sourcePublisher',
);

export const PUBLISH_FIELD_ANCHORS: Record<string, { id: string; label: string }> = {
  price: { id: 'price-amount-min', label: 'price' },
  primaryImage: { id: 'image-url', label: 'primary image' },
  source: { id: 'source-url', label: 'source' },
};

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_IMAGE_BYTES = 1_500_000;

const readImageAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose a JPEG, PNG, WebP, or GIF image.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('Image must be 1.5 MB or smaller.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Could not read that image.'));
    };
    reader.onerror = () => {
      reject(new Error('Could not read that image.'));
    };
    reader.readAsDataURL(file);
  });

const imageTitleFromUrl = (url: string, fileName: string | null) => {
  if (fileName) {
    return fileName;
  }
  if (url.startsWith('data:')) {
    return 'Uploaded image';
  }
  try {
    const path = new URL(url).pathname.split('/').filter(Boolean).at(-1);
    return path ? decodeURIComponent(path) : 'Current image';
  } catch {
    return 'Current image';
  }
};

export type CatalogEditFormStore = FormStore<typeof CatalogEditSchema>;

function CatalogEditFieldLabel({ htmlFor, field }: { htmlFor: string; field: (typeof CATALOG_EDIT_FIELDS)[number] }) {
  return (
    <FieldLabel htmlFor={htmlFor}>
      {field.label}
      {'optional' in field && field.optional ? (
        <span className="font-normal text-muted-foreground">(optional)</span>
      ) : null}
    </FieldLabel>
  );
}

type CatalogEditTextFieldProps = {
  form: CatalogEditFormStore;
  field: (typeof CATALOG_EDIT_FIELDS)[number];
  disabled: boolean;
  type?: 'text' | 'url' | 'number';
};

export function CatalogEditTextField({ form, field, disabled, type = 'text' }: CatalogEditTextFieldProps) {
  const descriptionId = `${field.id}-description`;
  const errorId = `${field.id}-error`;

  return (
    <FormischField of={form} path={field.path}>
      {(store) => {
        const errorMessage = fieldErrorMessage(store.errors);
        const describedBy = errorMessage ? `${descriptionId} ${errorId}` : descriptionId;

        return (
          <Field data-invalid={store.errors ? true : undefined}>
            <CatalogEditFieldLabel htmlFor={field.id} field={field} />
            <Input
              {...store.props}
              id={field.id}
              type={type}
              inputMode={type === 'number' ? 'decimal' : undefined}
              value={store.input}
              placeholder={field.placeholder}
              aria-invalid={Boolean(store.errors)}
              aria-describedby={describedBy}
              disabled={disabled}
            />
            <FieldDescription id={descriptionId}>{field.description}</FieldDescription>
            <FieldError id={errorId}>{errorMessage}</FieldError>
          </Field>
        );
      }}
    </FormischField>
  );
}

type CatalogEditSelectFieldProps = {
  form: CatalogEditFormStore;
  field: (typeof CATALOG_EDIT_FIELDS)[number];
  options: Array<{ id: string; name: string }>;
  disabled: boolean;
  isPending?: boolean;
  isError?: boolean;
  loadError?: string;
};

export function CatalogEditSelectField({
  form,
  field,
  options,
  disabled,
  isPending = false,
  isError = false,
  loadError = 'Could not load options.',
}: CatalogEditSelectFieldProps) {
  const descriptionId = `${field.id}-description`;
  const errorId = `${field.id}-error`;
  const items = options.map((option) => ({ value: option.id, label: option.name }));

  return (
    <FormischField of={form} path={field.path}>
      {(store) => {
        const errorMessage = isError ? loadError : fieldErrorMessage(store.errors);
        const describedBy = errorMessage ? `${descriptionId} ${errorId}` : descriptionId;
        const selectedLabel = options.find((option) => option.id === store.input)?.name;

        return (
          <Field data-invalid={errorMessage ? true : undefined}>
            <CatalogEditFieldLabel htmlFor={field.id} field={field} />
            <Select
              value={store.input || null}
              items={items}
              disabled={disabled || isPending || isError}
              onValueChange={(next) => {
                if (typeof next === 'string') {
                  store.onChange(next);
                }
              }}
            >
              <SelectTrigger
                id={field.id}
                className="w-full"
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={describedBy}
                aria-required
              >
                <SelectValue placeholder={isPending ? 'Loading…' : field.placeholder}>{selectedLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription id={descriptionId}>{field.description}</FieldDescription>
            <FieldError id={errorId}>{errorMessage}</FieldError>
          </Field>
        );
      }}
    </FormischField>
  );
}

type CatalogImageAttachmentFieldProps = {
  form: CatalogEditFormStore;
  disabled: boolean;
};

export function CatalogImageAttachmentField({ form, disabled }: CatalogImageAttachmentFieldProps) {
  const field = CATALOG_EDIT_IMAGE_URL_FIELD;
  const descriptionId = `${field.id}-description`;
  const errorId = `${field.id}-error`;
  const fileInputId = `${field.id}-file`;
  const urlInputId = `${field.id}-remote`;
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <FormischField of={form} path={field.path}>
      {(store) => {
        const imageUrl = store.input ?? '';
        const formError = fieldErrorMessage(store.errors);
        const errorMessage = uploadError ?? formError;
        const describedBy = errorMessage ? `${descriptionId} ${errorId}` : descriptionId;
        const hasImage = Boolean(imageUrl);
        const showUrlInput = !imageUrl.startsWith('data:');
        const attachmentState = isReading ? 'uploading' : errorMessage ? 'error' : hasImage ? 'done' : 'idle';

        const applyFile = (file: File | undefined) => {
          if (!file || disabled) {
            return;
          }
          setUploadError(null);
          setIsReading(true);
          void readImageAsDataUrl(file)
            .then((dataUrl) => {
              setFileName(file.name);
              store.onChange(dataUrl);
            })
            .catch((error: unknown) => {
              setUploadError(error instanceof Error ? error.message : 'Could not read that image.');
            })
            .finally(() => {
              setIsReading(false);
            });
        };

        const help = (
          <>
            <FieldDescription id={descriptionId}>{field.description}</FieldDescription>
            <FieldError id={errorId}>{errorMessage}</FieldError>
          </>
        );

        return (
          <FieldGroup>
            <Field id={field.id} data-invalid={errorMessage ? true : undefined}>
              <CatalogEditFieldLabel htmlFor={fileInputId} field={field} />
              <Attachment
                state={attachmentState}
                className="w-full min-w-0"
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  applyFile(event.dataTransfer.files[0]);
                }}
              >
                <AttachmentMedia variant={hasImage && !isReading ? 'image' : 'icon'}>
                  {isReading ? (
                    <Loader2Icon aria-hidden="true" className="animate-spin" />
                  ) : hasImage ? (
                    <img src={imageUrl} alt="" />
                  ) : (
                    <PlusIcon aria-hidden="true" />
                  )}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>
                    {isReading ? 'Reading image…' : hasImage ? imageTitleFromUrl(imageUrl, fileName) : 'Upload image'}
                  </AttachmentTitle>
                  <AttachmentDescription>
                    {hasImage ? 'Click to replace, or drop a new file.' : 'JPEG, PNG, WebP, or GIF up to 1.5 MB.'}
                  </AttachmentDescription>
                </AttachmentContent>
                {hasImage ? (
                  <AttachmentActions>
                    <AttachmentAction
                      type="button"
                      aria-label="Remove image"
                      disabled={disabled || isReading}
                      onClick={() => {
                        setFileName(null);
                        setUploadError(null);
                        store.onChange('');
                      }}
                    >
                      <XIcon aria-hidden="true" />
                    </AttachmentAction>
                  </AttachmentActions>
                ) : null}
                <AttachmentTrigger
                  aria-label={hasImage ? 'Replace primary image' : 'Upload primary image'}
                  render={<label htmlFor={fileInputId} />}
                />
              </Attachment>
              <input
                id={fileInputId}
                type="file"
                accept={IMAGE_ACCEPT}
                className="sr-only"
                disabled={disabled || isReading}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={describedBy}
                onChange={(event) => {
                  applyFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              {showUrlInput ? null : help}
            </Field>
            {showUrlInput ? (
              <>
                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Or paste a URL
                </FieldSeparator>
                <Field data-invalid={errorMessage ? true : undefined}>
                  <FieldLabel htmlFor={urlInputId}>Image URL</FieldLabel>
                  <Input
                    {...store.props}
                    id={urlInputId}
                    type="url"
                    value={imageUrl}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={describedBy}
                    disabled={disabled || isReading}
                    onChange={(event) => {
                      setFileName(null);
                      setUploadError(null);
                      store.onChange(event.target.value);
                    }}
                  />
                  {help}
                </Field>
              </>
            ) : null}
          </FieldGroup>
        );
      }}
    </FormischField>
  );
}
