export type AsyncState = {
  deleteError: string | null;
  isDeleting: boolean;
  isLoadingList: boolean;
  isLoadingOne: boolean;
  isSaving: boolean;
  listError: string | null;
  saveError: string | null;
};

export const initialAsyncState: AsyncState = {
  deleteError: null,
  isDeleting: false,
  isLoadingList: false,
  isLoadingOne: false,
  isSaving: false,
  listError: null,
  saveError: null
};
