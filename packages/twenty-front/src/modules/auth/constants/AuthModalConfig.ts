import {
  type ModalSize,
  type ModalVariants,
} from '@/ui/layout/modal/components/Modal';

type AuthModalConfigType = {
  size: ModalSize;
  variant: ModalVariants;
  showScrollWrapper: boolean;
};

export const AUTH_MODAL_CONFIG: {
  default: AuthModalConfigType;
  [key: string]: AuthModalConfigType;
} = {
  default: {
    size: 'medium',
    variant: 'primary',
    showScrollWrapper: true,
  },
};
