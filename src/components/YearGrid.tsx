import { HabitWithLogs } from '@/lib/types'
import { buildYearGrid, getMonthLabels } from '@/lib/utils'

interface Props {
  habits: HabitWithLogs[]
}

// Vrátí Tailwind třídu barvy buňky podle stavu dne
function cellColor(total: number, done: number, isFuture: boolean): string {
  if (isFuture || total === 0) return 'bg-gray-800'
  if (done === total) return 'bg-green-600'
  if (done > 0) return 'bg-green-900'
  return 'bg-red-900'
}

// Krátké názvy dnů v týdnu (Po–Ne), jen lichá zobrazíme pro úsporu místa
const DOW_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export default function YearGrid({ habits }: Props) {
  if (habits.length === 0) {
    return (
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <p className="text-sm text-gray-500">Zatím nemáš žádné zvyky. Přidej první zvyk a roční přehled se zobrazí zde.</p>
      </section>
    )
  }

  const year = new Date().getFullYear()
  const columns = buildYearGrid(habits)
  const monthLabels = getMonthLabels(year)

  // Sestavíme mapu colIndex → název měsíce pro rychlé vyhledání
  const monthByCol = new Map(monthLabels.map(({ label, colIndex }) => [colIndex, label]))

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h2 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Roční přehled {year}
      </h2>

      {/* Scrollovatelný wrapper pro mobil */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">

          {/* Popisky měsíců */}
          <div className="flex gap-1 pl-7">
            {columns.map((_, colIdx) => (
              <div key={colIdx} className="w-3 text-center">
                {monthByCol.has(colIdx) && (
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {monthByCol.get(colIdx)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Řádky dnů (Po–Ne) */}
          {DOW_LABELS.map((dowLabel, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-1">
              {/* Popisek dne — zobrazíme jen Po, St, Pá */}
              <span className="w-6 text-right text-[10px] text-gray-600 shrink-0">
                {rowIdx % 2 === 0 ? dowLabel : ''}
              </span>

              {columns.map((week, colIdx) => {
                const cell = week[rowIdx]
                if (!cell) {
                  // Prázdná buňka (začátek/konec roku mimo týden)
                  return <div key={colIdx} className="w-3 h-3" />
                }
                const color = cellColor(cell.total, cell.done, cell.isFuture)
                const tooltip = cell.isFuture
                  ? cell.date
                  : cell.total === 0
                    ? `${cell.date} — žádný zvyk`
                    : `${cell.date} — ${cell.done}/${cell.total} splněno`

                return (
                  <div
                    key={colIdx}
                    title={tooltip}
                    className={`w-3 h-3 rounded-sm ${color} cursor-default`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="font-medium text-gray-400">Legenda:</span>
        <LegendItem color="bg-green-600" label="Vše splněno" />
        <LegendItem color="bg-green-900" label="Částečně splněno" />
        <LegendItem color="bg-red-900" label="Nic nesplněno" />
        <LegendItem color="bg-gray-800" label="Žádný zvyk / budoucnost" />
      </div>
    </section>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
