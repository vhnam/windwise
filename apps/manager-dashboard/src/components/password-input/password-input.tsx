import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';

import { Button } from '@windwise/ui/components/button';
import { ButtonGroup } from '@windwise/ui/components/button-group';
import { Input } from '@windwise/ui/components/input';

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'>;

export const PasswordInput = (props: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ButtonGroup>
      <Input {...props} type={showPassword ? 'text' : 'password'} />
      <Button nativeButton variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
      </Button>
    </ButtonGroup>
  );
};
