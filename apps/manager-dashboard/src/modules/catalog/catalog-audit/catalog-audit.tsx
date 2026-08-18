import { Link } from '@tanstack/react-router';
import { HistoryIcon } from 'lucide-react';

import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@windwise/ui/components/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@windwise/ui/components/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';

import { CatalogAuditHeader } from './catalog-audit-header';
import { useCatalogAuditActions } from './catalog-audit.actions';

function CatalogAudit() {
  const { table, entityId, totalCount, pageCount, currentPage } = useCatalogAuditActions();
  const rows = table.getRowModel().rows;
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  return (
    <div className="-mx-4 flex min-h-full flex-col">
      <CatalogAuditHeader entityId={entityId} />

      <div className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
        {totalCount === 0 ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>
                <h2 className="text-sm font-medium">Changes</h2>
              </CardTitle>
              <p className="text-xs text-muted-foreground">Who changed this record and when.</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <HistoryIcon className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium">No changes recorded yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Edits, reviews, and status changes will appear here after the first save.
              </p>
              <Button
                nativeButton={false}
                variant="outline"
                className="mt-4"
                render={<Link to="/catalog/$modelId/edit" params={{ modelId: entityId }} />}
              >
                Return to the record
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="border-b">
                <CardTitle>
                  <h2 className="text-sm font-medium">Changes</h2>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Who changed this record and when. Open a row to inspect field diffs.
                </p>
              </CardHeader>
              <CardContent className="px-0 py-0">
                <Table>
                  <caption className="sr-only">
                    Audit history, page {currentPage} of {pageCount}
                  </caption>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {rows.length ? (
                      rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="align-middle">
                              <table.FlexRender cell={cell} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                          No results on this page.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {`Page ${currentPage} of ${pageCount} · ${totalCount} ${totalCount === 1 ? 'change' : 'changes'}`}
              </p>
              {pageCount > 1 ? (
                <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        size="default"
                        href="#"
                        aria-disabled={!canPreviousPage}
                        tabIndex={canPreviousPage ? undefined : -1}
                        className={!canPreviousPage ? 'pointer-events-none opacity-50' : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          if (canPreviousPage) {
                            table.previousPage();
                          }
                        }}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        size="default"
                        href="#"
                        aria-disabled={!canNextPage}
                        tabIndex={canNextPage ? undefined : -1}
                        className={!canNextPage ? 'pointer-events-none opacity-50' : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          if (canNextPage) {
                            table.nextPage();
                          }
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

export default CatalogAudit;
