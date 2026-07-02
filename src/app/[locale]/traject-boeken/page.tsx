'use client'

import { useState, useEffect } from 'react'
import { formatPrice, formatDuur } from '@/lib/traject'

interface TrajectCursus {
  id: string
  naam: string
  duur_werkdagen: number
  prijs_cents: number
  prijs_ex_btw: number
  actief: boolean
}
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isToday, isPast } from 'date-fns'
import { nl } from 'date-fns/locale'

export default function TrajectBoekenContent() {
  const [cursussen, setCursussen] = useState<TrajectCursus[]>([])
  const [selectedCursus, setSelectedCursus] = useState<TrajectCursus | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [allCalendarDates, setAllCalendarDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [blockDates, setBlockDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDates, setLoadingDates] = useState(false)
  const [horizonInfo, setHorizonInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Laad cursussen bij mount
  useEffect(() => {
    async function loadCursussen() {
      try {
        const response = await fetch('/api/traject/cursussen')
        if (!response.ok) throw new Error('Kan cursussen niet laden')
        const data = await response.json()
        setCursussen(data.cursussen)
      } catch (err) {
        setError('Kan cursussen niet laden')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadCursussen()
  }, [])

  // Laad beschikbare datums wanneer cursus gekozen wordt
  useEffect(() => {
    if (!selectedCursus) return

    async function loadAvailableDates() {
      setLoadingDates(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/traject/beschikbare-datums?cursusId=${selectedCursus!.id}`
        )

        if (!response.ok) {
          throw new Error('Kan beschikbare datums niet laden')
        }

        const data = await response.json()
        setAllCalendarDates(data.availableDates.map((d: any) => d.date))
        setAvailableDates(data.availableDates.filter((d: any) => d.available).map((d: any) => d.date))
        setHorizonInfo(data.horizon)
      } catch (err) {
        setError('Kan beschikbare datums niet laden')
        console.error(err)
      } finally {
        setLoadingDates(false)
      }
    }

    loadAvailableDates()
  }, [selectedCursus])

  // Bereken blok datums wanneer datum gekozen wordt
  useEffect(() => {
    if (!selectedDate || !selectedCursus) {
      setBlockDates([])
      return
    }

    // Simuleer blok berekening (in productie zou dit via API komen)
    if (selectedCursus.duur_werkdagen === 0) {
      setBlockDates([selectedDate])
    } else {
      // Voor demo: simuleer werkdagen blok
      const block: string[] = []
      const cursor = new Date(selectedDate)
      let remaining = selectedCursus.duur_werkdagen

      while (remaining > 0) {
        if (!isWeekend(cursor)) {
          block.push(cursor.toISOString().split('T')[0])
          remaining--
        }
        cursor.setDate(cursor.getDate() + 1)
      }

      setBlockDates(block)
    }
  }, [selectedDate, selectedCursus])

  const formatBlockDates = () => {
    if (blockDates.length === 0) return ''

    const formatted = blockDates.map((d) => {
      const date = new Date(d)
      const day = format(date, 'EEE', { locale: nl })
      const num = format(date, 'd MMM', { locale: nl })
      return `${day} ${num}`
    })

    return formatted.join(', ')
  }

  const prijsIncl = Math.round((selectedCursus?.prijs_cents || 0) * 1.21)
  const aanbetaling = Math.round(prijsIncl / 2)

  const getCalendarDays = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }

  const isDateAvailable = (date: Date) => {
    const isoDate = date.toISOString().split('T')[0]
    return availableDates.includes(isoDate)
  }

  const isDateInHorizon = (date: Date) => {
    if (!horizonInfo) return false
    const start = new Date(horizonInfo.start)
    const end = new Date(horizonInfo.einde)
    return date >= start && date <= end
  }

  const isDateReturnedByAPI = (date: Date) => {
    const isoDate = date.toISOString().split('T')[0]
    return allCalendarDates.includes(isoDate)
  }

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return

    const isoDate = date.toISOString().split('T')[0]
    setSelectedDate(isoDate)
  }

  const isWorkshop = selectedCursus?.duur_werkdagen === 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0A07] flex items-center justify-center">
        <div className="text-[#C4A265] text-xl">Laden...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0C0A07] flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0C0A07] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#C4A265] mb-4">
            Boek jouw traject
          </h1>
          <p className="text-[#FBF8F2]/80 text-lg">
            Kies een traject en selecteer je startdatum
          </p>
        </div>

        {!selectedCursus ? (
          /* Stap 1: Cursus kiezen */
          <div className="space-y-6">
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#FBF8F2] mb-8">
              Kies jouw traject
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {cursussen.map((cursus) => (
                <div
                  key={cursus.id}
                  onClick={() => setSelectedCursus(cursus)}
                  className="bg-[#1a1614] border border-[#C4A265]/20 p-8 rounded-lg cursor-pointer hover:border-[#C4A265] transition-colors"
                >
                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#C4A265] mb-3">
                    {cursus.naam}
                  </h3>
                  <div className="space-y-2 text-[#FBF8F2]/90">
                    <p className="text-lg">
                      <span className="text-[#C4A265]">Duur:</span> {formatDuur(cursus.duur_werkdagen)}
                    </p>
                    <p className="text-lg">
                      <span className="text-[#C4A265]">Prijs:</span> {formatPrice(cursus.prijs_cents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Stap 2: Kalender & datum kiezen */
          <div className="space-y-8">
            {/* Terug naar cursussen */}
            <button
              onClick={() => {
                setSelectedCursus(null)
                setSelectedDate(null)
                setBlockDates([])
                setAvailableDates([])
              }}
              className="text-[#C4A265] hover:text-[#FBF8F2] transition-colors"
            >
              ← Terug naar trajecten
            </button>

            {/* Geselecteerde cursus info */}
            <div className="bg-[#1a1614] border border-[#C4A265]/20 p-8 rounded-lg">
              <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#C4A265] mb-4">
                {selectedCursus.naam}
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-[#FBF8F2]/90">
                <p className="text-lg">
                  <span className="text-[#C4A265]">Duur:</span> {formatDuur(selectedCursus.duur_werkdagen)}
                </p>
                <p className="text-lg">
                  <span className="text-[#C4A265]">Prijs:</span> {formatPrice(selectedCursus.prijs_cents)}
                </p>
              </div>
            </div>

            {/* Kalender */}
            <div className="bg-[#1a1614] border border-[#C4A265]/20 p-8 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="text-[#C4A265] hover:text-[#FBF8F2] transition-colors px-4 py-2"
                  disabled={loadingDates}
                >
                  ←
                </button>
                <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#FBF8F2]">
                  {format(currentMonth, 'MMMM yyyy', { locale: nl })}
                </h3>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="text-[#C4A265] hover:text-[#FBF8F2] transition-colors px-4 py-2"
                  disabled={loadingDates}
                >
                  →
                </button>
              </div>

              {loadingDates ? (
                <div className="text-center py-12">
                  <div className="text-[#C4A265] text-lg">Beschikbare datums laden...</div>
                </div>
              ) : (
                <>
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
                      <div key={day} className="text-center text-[#C4A265] font-semibold">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {getCalendarDays().map((date) => {
                      const isoDate = date.toISOString().split('T')[0]
                      const isAvailable = isDateAvailable(date)
                      const isSelected = selectedDate === isoDate
                      const isWeekendDay = isWeekend(date)
                      const isPastDate = isPast(date) && !isToday(date)
                      const inHorizon = isDateInHorizon(date)
                      const isReturnedByAPI = isDateReturnedByAPI(date)

                      let className =
                        'aspect-square flex items-center justify-center rounded-lg transition-colors '

                      if (isSelected) {
                        className += 'bg-[#C4A265] text-[#0C0A07] font-bold cursor-pointer'
                      } else if (isWeekendDay) {
                        className += 'text-[#C4A265]/30 cursor-not-allowed'
                      } else if (!inHorizon || isPastDate) {
                        className += 'text-[#C4A265]/20 cursor-not-allowed'
                      } else if (!isReturnedByAPI) {
                        className += 'text-[#C4A265]/20 cursor-not-allowed'
                      } else if (isAvailable) {
                        className += 'bg-[#C4A265]/20 text-[#FBF8F2] cursor-pointer hover:bg-[#C4A265]/40'
                      } else {
                        className += 'text-[#C4A265]/40 cursor-not-allowed line-through'
                      }

                      return (
                        <button
                          key={isoDate}
                          onClick={() => handleDateClick(date)}
                          disabled={!isAvailable || isWeekendDay || !inHorizon || isPastDate}
                          className={className}
                        >
                          {format(date, 'd')}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Samenvatting */}
            {selectedDate && (
              <div className="bg-[#1a1614] border-2 border-[#C4A265] p-8 rounded-lg">
                <h3 className="font-['Cormorant_Garamond'] text-3xl text-[#C4A265] mb-6">
                  Samenvatting
                </h3>

                <div className="space-y-4 text-[#FBF8F2]/90">
                  <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                    <span className="text-lg">Traject</span>
                    <span className="text-lg font-semibold">{selectedCursus.naam}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                    <span className="text-lg">Startdatum</span>
                    <span className="text-lg font-semibold">
                      {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
                    </span>
                  </div>

                  {isWorkshop ? (
                    <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                      <span className="text-lg">Datum</span>
                      <span className="text-lg font-semibold">
                        {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start pb-4 border-b border-[#C4A265]/20">
                      <span className="text-lg">Trajectdagen</span>
                      <span className="text-lg font-semibold text-right max-w-[50%]">
                        {formatBlockDates()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                    <span className="text-lg">Totaal</span>
                    <span className="text-lg font-semibold">
                      {formatPrice(prijsIncl)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-xl font-semibold text-[#C4A265]">Aanbetaling</span>
                    <span className="text-xl font-bold text-[#C4A265]">
                      {formatPrice(aanbetaling)}
                    </span>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    className="w-full bg-[#C4A265] hover:bg-[#C4A265]/90 text-[#0C0A07] font-bold py-4 px-6 rounded-lg transition-colors"
                    onClick={() => {
                      alert('Betaling komt in STAP 3c')
                    }}
                  >
                    Doorgaan naar betaling
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}