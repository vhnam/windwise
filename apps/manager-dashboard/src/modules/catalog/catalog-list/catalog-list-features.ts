import {
  columnVisibilityFeature,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
} from '@tanstack/react-table';

export const catalogListTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export type CatalogListTableFeatures = typeof catalogListTableFeatures;

export type CatalogListColumnMeta = {
  className?: string;
};
