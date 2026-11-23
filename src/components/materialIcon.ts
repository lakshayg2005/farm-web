/** The section pages name their icons with our own set; the workspace shell draws them as Material Symbols. */
const MAP: Record<string, string> = {
  tag: 'inventory_2',
  box: 'shopping_basket',
  plot: 'grid_view',
  calendar: 'event_available',
  sprout: 'potted_plant',
  basket: 'storefront',
  search: 'travel_explore',
  clipboard: 'fact_check',
  shield: 'verified_user',
  grid: 'dashboard',
  route: 'route',
}

export const materialIcon = (name: string) => MAP[name] ?? 'circle'
