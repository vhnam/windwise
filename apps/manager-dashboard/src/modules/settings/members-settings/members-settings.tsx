import { Link } from '@tanstack/react-router';
import { Loader2Icon, LockIcon, UsersIcon } from 'lucide-react';

import type { Role } from '@windwise/schemas';
import { Avatar, AvatarFallback } from '@windwise/ui/components/avatar';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@windwise/ui/components/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@windwise/ui/components/field';
import { Input } from '@windwise/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@windwise/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';

import { MembersSettingsHeader } from './members-settings-header';
import { THRESHOLD_MAX_DAYS, THRESHOLD_MIN_DAYS, useMembersSettingsActions } from './members-settings.actions';

const ROLES: Array<{ id: Role; name: string }> = [
  { id: 'owner', name: 'Owner' },
  { id: 'admin', name: 'Admin' },
  { id: 'editor', name: 'Editor' },
  { id: 'reviewer', name: 'Reviewer' },
  { id: 'viewer', name: 'Viewer' },
];

const ROLE_ITEMS = ROLES.map((role) => ({ value: role.id, label: role.name }));

const getInitials = (name: string) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'WW';
};

const roleLabel = (role: Role) => ROLES.find((item) => item.id === role)?.name ?? role;

function MembersSettings() {
  const {
    members,
    canManage,
    pendingUserId,
    threshold,
    setThreshold,
    thresholdError,
    markThresholdTouched,
    isSavingThreshold,
    changeRole,
    saveThreshold,
  } = useMembersSettingsActions();
  const memberCount = members.length;
  const thresholdHintId = 'staleness-threshold-hint';
  const thresholdErrorId = 'staleness-threshold-error';

  return (
    <div className="-mx-4 flex min-h-full flex-col">
      <MembersSettingsHeader />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
        {!canManage ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <LockIcon className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium">You don’t have permission to manage members</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Only owners and admins can change roles and catalog verification settings.
              </p>
              <Button nativeButton={false} variant="outline" className="mt-4" render={<Link to="/catalog" />}>
                Back to catalog
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card id="members">
              <CardHeader className="border-b">
                <CardTitle>
                  <h2 className="text-sm font-medium">People</h2>
                </CardTitle>
                <p className="text-xs text-muted-foreground" role="status" aria-atomic="true">
                  {memberCount === 0
                    ? 'No members in this organization'
                    : `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`}
                </p>
              </CardHeader>
              <CardContent className="overflow-x-auto px-0 py-0">
                {memberCount === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <UsersIcon className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
                    <p className="font-medium">No members yet</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Members of this organization will appear here once they are added.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <caption className="sr-only">Organization members and their roles</caption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-44">Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => {
                        const isPending = pendingUserId === member.userId;
                        return (
                          <TableRow key={member.id} aria-busy={isPending}>
                            <TableCell className="align-middle">
                              <div className="flex min-w-0 items-center gap-3">
                                <Avatar size="sm" aria-hidden="true">
                                  <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                                </Avatar>
                                <span className="min-w-0 truncate font-medium">{member.displayName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="align-middle">
                              <span className="block min-w-0 break-all text-muted-foreground">{member.email}</span>
                            </TableCell>
                            <TableCell className="align-middle">
                              <Select
                                value={member.role}
                                items={ROLE_ITEMS}
                                disabled={isPending}
                                onValueChange={(next) => {
                                  if (typeof next === 'string' && next !== member.role) {
                                    void changeRole(member.userId, next as Role);
                                  }
                                }}
                              >
                                <SelectTrigger
                                  className="w-full min-w-36 sm:w-40"
                                  aria-label={`Role for ${member.displayName}`}
                                  aria-busy={isPending}
                                >
                                  <SelectValue>{roleLabel(member.role)}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card id="verification-settings" className="max-w-xl">
              <CardHeader className="border-b">
                <CardTitle>
                  <h2 className="text-sm font-medium">Verification settings</h2>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Controls which published records appear in the verification queue.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field data-invalid={thresholdError ? true : undefined}>
                  <FieldLabel htmlFor="staleness-threshold">Staleness threshold (days)</FieldLabel>
                  <Input
                    id="staleness-threshold"
                    type="number"
                    inputMode="numeric"
                    min={THRESHOLD_MIN_DAYS}
                    max={THRESHOLD_MAX_DAYS}
                    step={1}
                    value={threshold}
                    aria-invalid={thresholdError ? true : undefined}
                    aria-describedby={thresholdError ? `${thresholdHintId} ${thresholdErrorId}` : thresholdHintId}
                    onBlur={markThresholdTouched}
                    onChange={(event) => setThreshold(event.target.value)}
                  />
                  <FieldDescription id={thresholdHintId}>
                    Published records last verified longer ago than this appear in the{' '}
                    <Link to="/verification-queue">verification queue</Link>.
                  </FieldDescription>
                  {thresholdError ? <FieldError id={thresholdErrorId}>{thresholdError}</FieldError> : null}
                </Field>
                <Button
                  type="button"
                  disabled={isSavingThreshold || Boolean(thresholdError)}
                  aria-busy={isSavingThreshold}
                  onClick={() => void saveThreshold()}
                >
                  {isSavingThreshold ? (
                    <>
                      <Loader2Icon aria-hidden="true" className="motion-reduce:animate-none animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save threshold'
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default MembersSettings;
