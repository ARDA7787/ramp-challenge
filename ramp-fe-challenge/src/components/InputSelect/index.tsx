import Downshift from "downshift"
import { useCallback, useState, useEffect, useRef } from "react"
import classNames from "classnames"
import {
  DropdownPosition,
  GetDropdownPositionFn,
  InputSelectOnChange,
  InputSelectProps
} from "./types"

export function InputSelect<TItem>({
  label,
  defaultValue,
  onChange: consumerOnChange,
  items,
  parseItem,
  isLoading,
  loadingLabel
}: InputSelectProps<TItem>) {
  const [selectedValue, setSelectedValue] = useState<TItem | null>(defaultValue ?? null)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 })
  const [isOpen, setIsOpen] = useState(false)

  const inputRef = useRef<HTMLDivElement>(null)

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      setDropdownPosition(getDropdownPosition(inputRef.current))
    }
  }, [])

  const onChange = useCallback<InputSelectOnChange<TItem>>(
    (selectedItem) => {
      if (selectedItem === null) return
      consumerOnChange(selectedItem)
      setSelectedValue(selectedItem)
    },
    [consumerOnChange]
  )

  useEffect(() => {
    if (!isOpen) return

    updateDropdownPosition()

    const handleScroll = () => updateDropdownPosition()
    window.addEventListener("scroll", handleScroll, { capture: true })

    return () => window.removeEventListener("scroll", handleScroll, { capture: true })
  }, [isOpen, updateDropdownPosition])

  return (
    <Downshift<TItem>
      id="RampSelect"
      onChange={onChange}
      selectedItem={selectedValue}
      itemToString={(item) => (item ? parseItem(item).label : "")}
      onStateChange={({ isOpen: newIsOpen }) => {
        if (typeof newIsOpen === "boolean") setIsOpen(newIsOpen)
      }}
    >
      {({
        getItemProps,
        getLabelProps,
        getMenuProps,
        isOpen: downshiftIsOpen,
        highlightedIndex,
        selectedItem,
        getToggleButtonProps,
        inputValue
      }) => {
        const toggleProps = getToggleButtonProps()
        const parsedSelectedItem = selectedItem ? parseItem(selectedItem) : null

        return (
          <div className="RampInputSelect--root">
            <label className="RampText--s RampText--hushed" {...getLabelProps()}>
              {label}
            </label>

            <div className="RampBreak--xs" />

            <div
              ref={inputRef}
              className="RampInputSelect--input"
              onClick={(event) => {
                updateDropdownPosition()
                toggleProps.onClick(event)
              }}
            >
              {inputValue}
            </div>

            <div
              className={classNames("RampInputSelect--dropdown-container", {
                "RampInputSelect--dropdown-container-opened": downshiftIsOpen
              })}
              {...getMenuProps()}
              style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
            >
              {renderItems()}
            </div>
          </div>
        )

        function renderItems() {
          if (!downshiftIsOpen) return null

          if (isLoading) return <div className="RampInputSelect--dropdown-item">{loadingLabel}…</div>

          if (items.length === 0) return <div className="RampInputSelect--dropdown-item">No items</div>

          return items.map((item, index) => {
            const parsedItem = parseItem(item)
            return (
              <div
                key={parsedItem.value}
                {...getItemProps({
                  index,
                  item,
                  className: classNames("RampInputSelect--dropdown-item", {
                    "RampInputSelect--dropdown-item-highlighted": highlightedIndex === index,
                    "RampInputSelect--dropdown-item-selected":
                      parsedSelectedItem?.value === parsedItem.value
                  })
                })}
              >
                {parsedItem.label}
              </div>
            )
          })
        }
      }}
    </Downshift>
  )
}

const getDropdownPosition: GetDropdownPositionFn = (target) => {
  if (target instanceof Element) {
    const { top, left, height } = target.getBoundingClientRect()
    return {
      top: top + height, 
      left
    }
  }
  return { top: 0, left: 0 }
}
