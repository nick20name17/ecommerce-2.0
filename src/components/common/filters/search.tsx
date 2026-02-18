import { Search } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

import { useOffsetParam, useSearchParam } from '@/hooks/use-query-params'

import { InputGroup, InputGroupAddon, InputGroupInput } from '../../ui/input-group'

const DEBOUNCE_TIMEOUT_MS = 250

export const SearchFilter = (props: React.ComponentProps<'input'>) => {
  const [search, setSearch] = useSearchParam()
  const [, setOffset] = useOffsetParam()

  const handleSearch = useDebouncedCallback((value: string) => {
    setSearch(value || null)
    setOffset(null)
  }, DEBOUNCE_TIMEOUT_MS)

  return (
    <InputGroup>
      <InputGroupInput
        {...props}
        defaultValue={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder='Search...'
      />
      <InputGroupAddon align='inline-start'>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  )
}
