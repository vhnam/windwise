import { AlertCircleIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@windwise/ui/components/alert';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@windwise/ui/components/pagination';
import { Skeleton } from '@windwise/ui/components/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';

import type { CatalogListColumnMeta } from './catalog-list-features';
import CatalogListFilters from './catalog-list-filters';
import { CatalogListHeader } from './catalog-list-header';
import { useCatalogListActions } from './catalog-list.actions';

const columnClassName = (meta: unknown) => (meta as CatalogListColumnMeta | undefined)?.className;

function CatalogList() {
  const { table, search, setStatus, isPending, isError, error, totalCount, canEdit } = useCatalogListActions();
  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const currentPage = table.state.pagination.pageIndex + 1;

  return (
    <div className="-mx-4 flex min-h-full flex-col">
      <CatalogListHeader canEdit={canEdit} />

      <div className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
        <CatalogListFilters search={search} setStatus={setStatus} table={table} />

        {isError ? (
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error instanceof Error ? error.message : 'Failed to load catalog.'}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="overflow-hidden border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className={columnClassName(header.column.columnDef.meta)}>
                          {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isPending ? (
                    Array.from({ length: 4 }, (_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={table.getVisibleLeafColumns().length}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : rows.length ? (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={columnClassName(cell.column.columnDef.meta)}>
                            <table.FlexRender cell={cell} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {totalCount === 0
                  ? '0 records'
                  : `Page ${currentPage} of ${Math.max(pageCount, 1)} · ${totalCount} total`}
              </p>
              {pageCount > 1 ? (
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        size="default"
                        href="#"
                        aria-disabled={!table.getCanPreviousPage()}
                        className={!table.getCanPreviousPage() ? 'pointer-events-none opacity-50' : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          table.previousPage();
                        }}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        size="default"
                        href="#"
                        aria-disabled={!table.getCanNextPage()}
                        className={!table.getCanNextPage() ? 'pointer-events-none opacity-50' : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          table.nextPage();
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CatalogList;
