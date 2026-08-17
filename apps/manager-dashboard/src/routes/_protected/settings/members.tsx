import { createFileRoute } from '@tanstack/react-router';

import { Badge } from '@windwise/ui/components/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';

import { listOrganizationMembersFn } from '#/lib/server/members';

export const Route = createFileRoute('/_protected/settings/members')({
  loader: async () => listOrganizationMembersFn(),
  component: MembersSettingsRoute,
});

function MembersSettingsRoute() {
  const members = Route.useLoaderData();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Members</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.userId}</TableCell>
              <TableCell>
                <Badge>{member.role}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
