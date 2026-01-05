import { createState } from 'twenty-ui/utilities';

export const authBypassEnabledState = createState<boolean>({
  key: 'authBypassEnabled',
  defaultValue: false,
});

