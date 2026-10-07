/**
 * The panel under every map: image calendar, time slider, play, split comparison and the selected index.
 * Each function receives the layout's state and helpers it uses as `ctx`.
 */
import { RefreshCw, ChevronDown, ChevronUp, Play, Pause, ChevronLeft, ChevronRight, CalendarDays, Satellite } from 'lucide-react';
import { MONTH_NAMES } from '../constants/chartConfig';

// Plain names for the satellites behind each picture.
const SENSOR_NAME = { 'sentinel-2': 'Clear-sky picture', landsat: 'Landsat picture', 'sentinel-1': 'Radar picture' };
const SENSOR_HINT = { 'sentinel-2': 'Sharp colour picture, blocked by cloud', landsat: 'Older, coarser picture', 'sentinel-1': 'Sees through cloud' };
const sensorName = (s) => SENSOR_NAME[s] || s;
const longDate = (d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function renderMapBottomPanel(ctx, indexValue, centerContent = null, hideCalendarAndSlider = false) {
  const { latestCalDate, jumpToLatestMonth, canPrevCal, canNextCal, SENSOR_DOT_COLOR, TIMELINE_DATA, activeDateSlot, bottomPanelHeight, calDaysInMonth, calFirstDay, calTrailing, calendarDates, calendarMonth, calendarYear, compareTimelineIndex, currentTimeline, currentTimelineA, currentTimelineB, effectiveSensor, isBottomPanelMinimized, isCompareMode, isPlaying, nextCalMonth, prevCalMonth, satellitePicker, selectDateWithSensor, selectedIndex, selectedTimelineIndex, setCompareTimelineIndex, setIsBottomPanelMinimized, setRefreshSlider, setSatellitePicker, setSelectedTimelineIndex, showCalendarTool, showTimeSliderTool, sliderPending, startBottomPanelResize, timelineLoading, togglePlay } = ctx;

  if (!showTimeSliderTool && !showCalendarTool) return null;

  const measure = (selectedIndex || 'NDVI').toUpperCase();
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
  const picturesThisMonth = (calendarDates || []).filter((d) => d.date.startsWith(monthPrefix)).length;
  const latestPrefix = latestCalDate ? latestCalDate.slice(0, 7) : null;
  const sensorsSeen = [...new Set((calendarDates || []).flatMap((d) => d.sensors))];
  const hasPictures = (calendarDates || []).length > 0 || TIMELINE_DATA.length > 0;

  return (
    <div style={{ height: isBottomPanelMinimized ? '52px' : `${bottomPanelHeight}px` }} className="bg-white border-t border-gray-200 shrink-0 flex flex-col relative overflow-hidden transition-all duration-300">
      {/* Draggable horizontal divider */}
      <div onMouseDown={startBottomPanelResize} className="absolute top-[-4px] left-0 right-0 h-2 cursor-row-resize hover:bg-green-500/55 active:bg-green-500 transition-colors z-50" />

      {/* Slider + play row */}
      {!hideCalendarAndSlider && showTimeSliderTool && (
        <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-4">
          <button
            onClick={togglePlay}
            disabled={TIMELINE_DATA.length < 2}
            title={isPlaying ? 'Pause' : 'Play through the pictures'}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white transition-colors disabled:bg-gray-200 disabled:text-gray-400 ${isCompareMode && activeDateSlot === 'B' ? 'bg-[var(--status-info)]' : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)]'}`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={15} />}
          </button>
          <div className="flex-1 relative min-w-0">
            {timelineLoading ? (
              <div className="flex items-center gap-2 h-8 text-sm text-gray-600">
                <RefreshCw size={14} className="animate-spin text-[var(--brand-primary)]" /> Loading the pictures…
              </div>
            ) : TIMELINE_DATA.length === 0 ? (
              <div className="flex items-center gap-2 h-8 text-sm text-gray-600">
                <span>No satellite pictures yet. They appear after the first monitoring run.</span>
              </div>
            ) : (
              <>
                <input type="range" min="0" max={TIMELINE_DATA.length - 1}
                  value={Math.min(isCompareMode ? (activeDateSlot === 'A' ? selectedTimelineIndex : compareTimelineIndex) : selectedTimelineIndex, TIMELINE_DATA.length - 1)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (isCompareMode && activeDateSlot === 'B') setCompareTimelineIndex(val);
                    else setSelectedTimelineIndex(val);
                  }}
                  aria-label="Picture date"
                  className={`w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer ${isCompareMode && activeDateSlot === 'B' ? 'accent-blue-600' : 'accent-green-700'}`} />
                <div className="flex justify-between px-0.5 mt-1">
                  {TIMELINE_DATA.map((t, i) => {
                    const isActive = isCompareMode ? (activeDateSlot === 'A' ? i === selectedTimelineIndex : i === compareTimelineIndex) : i === selectedTimelineIndex;
                    return <span key={i} className={`text-[11px] transition-colors ${isActive ? 'text-green-700 font-bold' : 'text-gray-500 font-medium'}`}>{t.label.split(',')[0]}</span>;
                  })}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!timelineLoading && TIMELINE_DATA.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap tabular-nums bg-green-50 text-green-800 border-green-200">
                {sliderPending ? (TIMELINE_DATA[Math.min(selectedTimelineIndex, TIMELINE_DATA.length - 1)]?.label ?? '…') : (currentTimeline?.label ?? '…')}
              </span>
            )}
            <button onClick={() => setRefreshSlider((n) => n + 1)} disabled={timelineLoading} title="Look for new pictures" aria-label="Look for new pictures"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-40">
              <RefreshCw size={14} className={timelineLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsBottomPanelMinimized(!isBottomPanelMinimized)}
              aria-label={isBottomPanelMinimized ? 'Open calendar and time slider' : 'Close calendar and time slider'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-semibold"
            >
              {isBottomPanelMinimized ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
              {isBottomPanelMinimized ? 'Open' : 'Close'}
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 bg-white">
        {/* Calendar */}
        {!hideCalendarAndSlider && showCalendarTool && (
          <div className="shrink-0 w-[360px] border-r border-gray-100 overflow-y-auto px-5 py-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-display text-base font-semibold text-gray-900 leading-tight">{MONTH_NAMES[calendarMonth]} {calendarYear}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {picturesThisMonth ? `${picturesThisMonth} ${picturesThisMonth === 1 ? 'picture' : 'pictures'} this month` : 'No pictures this month'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {latestPrefix && latestPrefix !== monthPrefix && (
                  <button onClick={jumpToLatestMonth} className="px-2.5 h-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50">Latest</button>
                )}
                <button onClick={prevCalMonth} disabled={!canPrevCal} aria-label="Previous month" title={canPrevCal ? 'Previous month' : 'No pictures before this month'}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={nextCalMonth} disabled={!canNextCal} aria-label="Next month" title={canNextCal ? 'Next month' : 'No future months'}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <span key={d} className="text-[11px] font-medium text-gray-400 h-6 flex items-center justify-center">{d}</span>
              ))}
              {Array.from({ length: calFirstDay }).map((_, i) => <span key={`pad-${i}`} />)}
              {Array.from({ length: calDaysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
                const matchIdx = TIMELINE_DATA.findIndex((t) => t.date === dateStr);
                const isHL = matchIdx !== -1;
                const isSelA = isHL && matchIdx === selectedTimelineIndex;
                const isSelB = isCompareMode && isHL && matchIdx === compareTimelineIndex;
                const dayCoverage = (calendarDates || []).find((d) => d.date === dateStr);
                const isFuture = dateStr > todayStr;
                const isToday = dateStr === todayStr;
                const hasPicture = isHL || !!dayCoverage;
                const dayClickable = isCompareMode ? isHL : hasPicture;

                let cls = 'text-gray-500';
                if (isSelA && isSelB) cls = 'bg-gradient-to-br from-[var(--brand-primary)] from-50% to-[var(--status-info)] to-50% text-white';
                else if (isSelA) cls = 'bg-[var(--brand-primary)] text-white';
                else if (isSelB) cls = 'bg-[var(--status-info)] text-white';
                else if (hasPicture) cls = 'bg-green-50 text-green-800 hover:bg-green-100 font-semibold';
                else if (isFuture) cls = 'text-gray-300';
                if (isToday && !isSelA && !isSelB) cls += ' ring-1 ring-inset ring-gray-300';

                const showCallout = satellitePicker?.date === dateStr;
                const openUpward = Math.floor((calFirstDay + day - 1) / 7) >= 3;
                return (
                  <div key={dateStr} className="relative">
                    <button disabled={!dayClickable}
                      title={dayCoverage ? dayCoverage.sensors.map(sensorName).join(', ') : isFuture ? 'Not yet' : 'No picture this day'}
                      aria-label={`${longDate(dateStr)}${hasPicture ? ', picture available' : ''}`}
                      onClick={() => {
                        if (isCompareMode) {
                          if (activeDateSlot === 'A') setSelectedTimelineIndex(matchIdx);
                          else setCompareTimelineIndex(matchIdx);
                          return;
                        }
                        if (!dayCoverage) { if (isHL) setSelectedTimelineIndex(matchIdx); return; }
                        if (dayCoverage.sensors.length > 1) setSatellitePicker(showCallout ? null : { date: dateStr, sensors: dayCoverage.sensors });
                        else selectDateWithSensor(dateStr, dayCoverage.sensors[0]);
                      }}
                      className={`h-9 w-full rounded-lg text-xs flex flex-col items-center justify-center gap-0.5 transition-colors disabled:cursor-default ${cls}`}>
                      <span className="tabular-nums">{day}</span>
                      {dayCoverage && (
                        <span className="flex items-center gap-0.5 leading-none">
                          {dayCoverage.sensors.map((s) => (
                            <span key={s} className="w-1 h-1 rounded-full" style={{ backgroundColor: (isSelA || isSelB) ? '#FFFFFF' : SENSOR_DOT_COLOR[s] }} />
                          ))}
                        </span>
                      )}
                    </button>
                    {showCallout && (
                      <div className={`absolute z-50 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-sm p-2.5 flex flex-col gap-1.5 w-max ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`} onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Which picture?</span>
                        {satellitePicker.sensors.map((s) => (
                          <button key={s} onClick={() => { selectDateWithSensor(dateStr, s); setSatellitePicker(null); }}
                            className="flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-lg text-gray-700 border border-gray-200 hover:bg-gray-50 whitespace-nowrap text-left">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SENSOR_DOT_COLOR[s] }} />
                            {sensorName(s)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, calTrailing) % 7 }).map((_, i) => <span key={`trail-${i}`} />)}
            </div>

            {/* What the dots mean */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1.5">
              {(sensorsSeen.length ? sensorsSeen : ['sentinel-2', 'sentinel-1']).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600" title={SENSOR_HINT[s]}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SENSOR_DOT_COLOR[s] }} />{sensorName(s)}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-600"><span className="w-3 h-3 rounded ring-1 ring-inset ring-gray-300" />Today</span>
            </div>
          </div>
        )}

        {centerContent ? centerContent : (
          <div className="flex-1 min-w-0 overflow-y-auto px-6 py-4">
            {!hasPictures ? (
              <div className="h-full flex items-center">
                <div className="flex items-start gap-4 max-w-lg">
                  <span className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 shrink-0"><Satellite size={18} /></span>
                  <div>
                    <p className="font-display text-base font-semibold text-gray-900">No satellite pictures yet</p>
                    <p className="text-sm text-gray-500 mt-1">They appear after the first monitoring run. Each green day in the calendar is then a picture you can open on the map.</p>
                    <button onClick={() => setRefreshSlider((n) => n + 1)} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      <RefreshCw size={13} /> Look again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* The picture on the map */}
                <div className="lg:w-[280px] shrink-0">
                  <p className="text-xs font-medium text-gray-500 mb-2">{isCompareMode ? 'Pictures compared' : 'Picture on the map'}</p>
                  {isCompareMode ? (
                    <div className="space-y-2">
                      {[['A', currentTimelineA, 'bg-[var(--brand-primary)]'], ['B', currentTimelineB, 'bg-[var(--status-info)]']].map(([slot, t, dot]) => t && (
                        <div key={slot} className={`rounded-xl border px-3 py-2.5 ${activeDateSlot === slot ? 'border-gray-300' : 'border-gray-200'}`}>
                          <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${dot}`} /><span className="text-xs font-semibold text-gray-500">{slot === 'A' ? 'Left' : 'Right'}</span></div>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{t.date ? longDate(t.date) : t.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : currentTimeline ? (
                    <div className="rounded-xl border border-gray-200 px-4 py-3">
                      <p className="font-display text-base font-semibold text-gray-900">{currentTimeline.date ? longDate(currentTimeline.date) : currentTimeline.label}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SENSOR_DOT_COLOR[effectiveSensor] }} />{sensorName(effectiveSensor)}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-700">{measure}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Pick a green day in the calendar.</p>
                  )}
                </div>

                {/* Recent pictures */}
                {(calendarDates || []).length > 0 && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5"><CalendarDays size={13} /> Recent pictures</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                      {calendarDates.slice(-6).reverse().map((d) => {
                        const isActive = currentTimeline?.date === d.date;
                        return (
                          <button key={d.date}
                            onClick={() => {
                              const [y, m] = d.date.split('-').map(Number);
                              if (y !== calendarYear || m - 1 !== calendarMonth) { ctx.setCalendarYear?.(y); ctx.setCalendarMonth?.(m - 1); }
                              if (d.sensors.length > 1) setSatellitePicker({ date: d.date, sensors: d.sensors });
                              else selectDateWithSensor(d.date, d.sensors[0]);
                            }}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-colors ${isActive ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <span className={`text-sm font-medium ${isActive ? 'text-green-800' : 'text-gray-800'}`}>{shortDate(d.date)}</span>
                            <span className="flex items-center gap-1 shrink-0">
                              {d.sensors.map((s) => <span key={s} title={sensorName(s)} className="w-2 h-2 rounded-full" style={{ backgroundColor: SENSOR_DOT_COLOR[s] }} />)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
