import { Field, FieldGroup, FieldLabel } from '@windwise/ui/components/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@windwise/ui/components/select';

const ALL_VALUE = 'all';

const SECTION_OPTIONS = [
  { value: '', label: 'Tất cả loại kèn' },
  { value: 'brass', label: 'Kèn đồng' },
  { value: 'woodwind', label: 'Kèn gỗ' },
];

const BUDGET_BAND_OPTIONS = [
  { value: '', label: 'Mọi ngân sách' },
  { value: 'under_20m', label: 'Dưới 20 triệu' },
  { value: '20_50m', label: '20 – 50 triệu' },
  { value: '50_100m', label: '50 – 100 triệu' },
  { value: 'over_100m', label: 'Trên 100 triệu' },
];

export type FilterBarValue = {
  section: string;
  family: string;
  budgetBand: string;
  brand: string;
};

export type FilterBarProps = {
  value: FilterBarValue;
  brandOptions: Array<{ value: string; label: string }>;
  familyOptions: Array<{ value: string; label: string }>;
  familyLocked?: boolean;
  onChange: (next: FilterBarValue) => void;
};

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

function toSelectValue(value: string) {
  return value.length > 0 ? value : ALL_VALUE;
}

function fromSelectValue(value: string | null) {
  if (!value || value === ALL_VALUE) {
    return '';
  }
  return value;
}

function FilterSelect({ id, label, value, disabled, options, onChange }: FilterSelectProps) {
  const items = Object.fromEntries(options.map((option) => [toSelectValue(option.value), option.label]));

  return (
    <Field className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={toSelectValue(value)}
        items={items}
        disabled={disabled}
        onValueChange={(next) => {
          onChange(fromSelectValue(typeof next === 'string' ? next : null));
        }}
      >
        <SelectTrigger id={id} className="h-11 min-h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} className="min-w-56">
          {options.map((option) => (
            <SelectItem key={option.value || ALL_VALUE} value={toSelectValue(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function FilterBar({ value, brandOptions, familyOptions, familyLocked, onChange }: FilterBarProps) {
  return (
    <FieldGroup
      role="group"
      aria-label="Bộ lọc danh mục nhạc cụ"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <FilterSelect
        id="catalog-filter-section"
        label="Loại kèn"
        value={value.section}
        options={SECTION_OPTIONS}
        onChange={(section) => onChange({ ...value, section })}
      />
      <FilterSelect
        id="catalog-filter-family"
        label="Dòng nhạc cụ"
        value={value.family}
        disabled={familyLocked}
        options={[{ value: '', label: 'Tất cả dòng nhạc cụ' }, ...familyOptions]}
        onChange={(family) => onChange({ ...value, family })}
      />
      <FilterSelect
        id="catalog-filter-budget"
        label="Ngân sách"
        value={value.budgetBand}
        options={BUDGET_BAND_OPTIONS}
        onChange={(budgetBand) => onChange({ ...value, budgetBand })}
      />
      <FilterSelect
        id="catalog-filter-brand"
        label="Thương hiệu"
        value={value.brand}
        options={[{ value: '', label: 'Tất cả thương hiệu' }, ...brandOptions]}
        onChange={(brand) => onChange({ ...value, brand })}
      />
    </FieldGroup>
  );
}

export { FilterBar };
