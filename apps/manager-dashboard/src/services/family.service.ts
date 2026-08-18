import { listFamiliesFn } from '#/lib/server/catalog';

export type FamilyOption = {
  id: string;
  name: string;
};

export const getFamilies = async (): Promise<FamilyOption[]> => listFamiliesFn();
