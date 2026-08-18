import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public')({
  component: PublicPathlessLayout,
});

function PublicPathlessLayout() {
  return <Outlet />;
}
