import { Settings2Icon } from 'lucide-react';

import { STATUS_FILTERS } from '@windwise/schemas';
import { Button } from '@windwise/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@windwise/ui/components/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@windwise/ui/components/select';

import { STATUS_LABEL } from '../catalog-status';
import type { useCatalogListActions } from './catalog-list.actions';

const ALL_STATUS = 'all';

const STATUS_SELECT_ITEMS = {
  [ALL_STATUS]: 'All statuses',
  ...Object.fromEntries(STATUS_FILTERS.map((status) => [status, STATUS_LABEL[status]])),
};

type CatalogListFiltersProps = Pick<ReturnType<typeof useCatalogListActions>, 'search' | 'setStatus' | 'table'>;

const CatalogListFilters = ({ search, setStatus, table }: CatalogListFiltersProps) => {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Select
        value={search.status ?? ALL_STATUS}
        items={STATUS_SELECT_ITEMS}
        onValueChange={(next) => {
          setStatus(typeof next === 'string' ? STATUS_FILTERS.find((status) => status === next) : undefined);
        }}
      >
        <SelectTrigger id="catalog-status-filter" size="sm" className="min-w-40" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectItem value={ALL_STATUS}>All statuses</SelectItem>
          {STATUS_FILTERS.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABEL[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="ml-auto" />}>
          <Settings2Icon />
          Columns
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CatalogListFilters;
