import { Rating, StatusChip } from '@/components/ui'
import { useI18n } from '@/i18n/i18n'
import { formatKm, freshness, rupees, type Produce } from './shop'
import { ProducePhoto } from './ProducePhoto'

export function ProduceCard({ item, onOpen, inCart }: { item: Produce; onOpen: () => void; inCart: boolean }) {
  const { t } = useI18n()
  const fresh = freshness(item.harvestDate)
  const low = item.qtyAvailable <= 10
  return (
    <button type="button" onClick={onOpen} className="card group flex h-full w-full flex-col overflow-hidden text-left transition-[border-color,box-shadow] duration-150 hover:border-primary hover:shadow-sm">
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-paper-deep">
        <ProducePhoto listingId={item.id} alt={item.cropName} />
        {item.isOrganic && (
          <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-on-primary">{t('Organic')}</span>
        )}
        {inCart && <span className="absolute top-2 right-2 rounded-full bg-surface-card px-2.5 py-0.5 text-xs font-bold text-primary">{t('In your cart')}</span>}
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-3.5">
        <span className="font-display text-xl leading-tight">
          {item.cropName}
          {item.variety && <span className="text-ink-soft">, {item.variety}</span>}
        </span>
        <span className="text-lg font-bold tabular-nums">
          {rupees(item.pricePerUnit)} <span className="text-sm font-medium text-ink-soft">{t('per {unit}', { unit: item.unit })}</span>
        </span>
        <span className="text-sm">
          {item.farmName} <span className="text-ink-soft">· {item.village ?? item.district}{item.distanceM !== undefined && ` · ${formatKm(item.distanceM)}`}</span>
        </span>
        <Rating value={item.farmRating} count={item.farmRatingCount} />
        <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
          <StatusChip tone={fresh.tone}>{t(fresh.days > 1 ? 'Harvested {n} days ago' : fresh.label, { n: fresh.days })}</StatusChip>
          {low && <StatusChip tone="warn">{t('Only {n} {unit} left', { n: item.qtyAvailable, unit: item.unit })}</StatusChip>}
        </span>
      </span>
    </button>
  )
}
