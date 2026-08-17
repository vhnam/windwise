import { getRouteApi } from '@tanstack/react-router';

const verificationRoute = getRouteApi('/_protected/verification-queue');

export const useCatalogVerificationActions = () => {
  const { items } = verificationRoute.useLoaderData();
  return { items };
};
