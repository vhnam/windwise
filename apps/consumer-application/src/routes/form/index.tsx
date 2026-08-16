import { createFileRoute } from '@tanstack/react-router';

import { FormPage } from '#/modules/form-page';

export const Route = createFileRoute('/form/')({
  component: FormPage,
  head: () => ({
    meta: [{ title: 'Biểu mẫu tư vấn — WindWise' }],
  }),
});
