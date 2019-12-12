export function isAlternateClick(
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
): boolean {
  const { nodeName, target } = event.currentTarget
  return (
    nodeName === 'A' &&
    ((target && target !== '_self') ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      (event.nativeEvent && event.nativeEvent.which === 2))
  )
}
