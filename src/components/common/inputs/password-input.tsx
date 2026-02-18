import { EyeIcon, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../../ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../ui/input-group'

export const PasswordInput = (props: React.ComponentProps<'input'>) => {
  const [isVisible, setIsVisible] = useState<boolean>(false)

  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

  return (
    <InputGroup>
      <InputGroupInput
        {...props}
        type={isVisible ? 'text' : 'password'}
        placeholder='••••••••'
      />
      <InputGroupAddon
        align='inline-end'
        onClick={toggleVisibility}
      >
        <Button
          variant='ghost'
          size='icon-sm'
        >
          {isVisible ? <EyeOff aria-hidden='true' /> : <EyeIcon aria-hidden='true' />}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}
