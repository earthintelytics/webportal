/**
 * The panel under every map: image calendar, time slider, play, split comparison and the selected index.
 * Moved out of CropDashboardLayout.jsx unchanged: each function receives the
 * layout's state and helpers it uses as `ctx`.
 */
import { RefreshCw, ChevronDown, ChevronUp, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from '../constants/chartConfig';

export function renderMapBottomPanel(ctx, indexValue, centerContent = null, hideCalendarAndSlider = false) {
  const { canPrevCal, canNextCal, SENSOR_DOT_COLOR, TIMELINE_DATA, activeDateSlot, bottomPanelHeight, calDaysInMonth, calFirstDay, calTrailing, calendarDates, calendarMonth, calendarYear, compareTimelineIndex, currentTimeline, currentTimelineA, currentTimelineB, effectiveSensor, isBottomPanelMinimized, isCompareMode, isPlaying, nextCalMonth, prevCalMonth, satellitePicker, selectDateWithSensor, selectedIndex, selectedTimelineIndex, setCompareTimelineIndex, setIsBottomPanelMinimized, setRefreshSlider, setSatellitePicker, setSelectedTimelineIndex, showCalendarTool, showTimeSliderTool, sliderPending, startBottomPanelResize, timelineLoading, togglePlay } = ctx;

    if (!showTimeSliderTool && !showCalendarTool) {
      return null;
    }
    return (
      <div style={{ height: isBottomPanelMinimized ? '52px' : `${bottomPanelHeight}px` }} className="bg-white border-t border-gray-200 shrink-0 flex flex-col relative overflow-hidden transition-all duration-300">
        {/* Draggable horizontal divider */}
        <div 
          onMouseDown={startBottomPanelResize} 
          className="absolute top-[-4px] left-0 right-0 h-2 cursor-row-resize hover:bg-green-500/55 active:bg-green-500 transition-colors z-50"
        />
        {/* Slider + Play row */}
        {!hideCalendarAndSlider && showTimeSliderTool && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4">
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: isCompareMode ? (activeDateSlot === 'A' ? '#3F8432' : '#2563EB') : '#3F8432' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={15} />}
            </button>
            <div className="flex-1 relative">
              {timelineLoading ? (
                <div className="flex items-center gap-2 h-8 text-xs text-gray-600">
                  <svg className="animate-spin h-4 w-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading satellite timeline…
                </div>
              ) : TIMELINE_DATA.length === 0 ? (
                <div className="flex items-center gap-2 h-8 text-xs text-gray-600">
                  <span>No imagery yet for {selectedIndex?.toUpperCase() || 'this index'} — pipeline may still be writing data.</span>
                  <button
                    onClick={() => setRefreshSlider(n => n + 1)}
                    title="Retry loading"
                    className="ml-1 p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-green-600 transition-colors"
                  ><RefreshCw size={12} /></button>
                </div>
              ) : (
                <>
                  <input type="range" min="0" max={TIMELINE_DATA.length - 1}
                    value={Math.min(
                      isCompareMode ? (activeDateSlot === 'A' ? selectedTimelineIndex : compareTimelineIndex) : selectedTimelineIndex,
                      TIMELINE_DATA.length - 1
                    )}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      if (isCompareMode) {
                        if (activeDateSlot === 'A') setSelectedTimelineIndex(val);
                        else setCompareTimelineIndex(val);
                      } else {
                        setSelectedTimelineIndex(val);
                      }
                    }}
                    className={`w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer ${
                      isCompareMode && activeDateSlot === 'B' ? 'accent-blue-600' : 'accent-green-600'
                    }`} />
                  <div className="flex justify-between px-0.5 mt-1">
                    {TIMELINE_DATA.map((t, i) => {
                      const isActive = isCompareMode
                        ? (activeDateSlot === 'A' ? i === selectedTimelineIndex : i === compareTimelineIndex)
                        : i === selectedTimelineIndex;
                      return (
                        <span key={i} className={`text-[11px] font-semibold transition-colors ${
                          isActive
                            ? (isCompareMode && activeDateSlot === 'B' ? 'text-green-600 font-bold' : 'text-green-600 font-bold')
                            : 'text-gray-600'
                        }`}>
                          {t.label.split(',')[0]}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Current acquisition date pill — shows pending state while waiting 10s */}
              {!timelineLoading && TIMELINE_DATA.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap tabular-nums transition-colors ${
                  sliderPending
                    ? 'bg-green-100 text-green-600 border-green-200'
                    : 'bg-green-50 text-green-700 border-green-100'
                }`}>
                  {sliderPending
                    ? (TIMELINE_DATA[Math.min(selectedTimelineIndex, TIMELINE_DATA.length - 1)]?.label ?? '…')
                    : (currentTimeline?.label ?? '…')}
                  {sliderPending && <span className="ml-1 opacity-70">↻</span>}
                </span>
              )}
              {/* Sensor + index are now chosen from the Map Layers legend
                  (renderLegendCards) rather than duplicated here. */}
              <button
                onClick={() => setRefreshSlider(n => n + 1)}
                disabled={timelineLoading}
                title="Refresh timeline data"
                className="p-1.5 rounded-full hover:bg-green-50 text-green-400 hover:text-green-600 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={13} className={timelineLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setIsBottomPanelMinimized(!isBottomPanelMinimized)}
                title={isBottomPanelMinimized ? "Expand bottom panel" : "Minimize bottom panel"}
                aria-label={isBottomPanelMinimized ? 'Open calendar and time slider' : 'Close calendar and time slider'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-semibold"
              >
                {isBottomPanelMinimized ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
                {isBottomPanelMinimized ? 'Open' : 'Close'}
              </button>
            </div>
          </div>
        )}

        <div className="flex divide-x divide-gray-100 bg-gray-50/30 min-h-0 flex-1">
          {/* Mini Calendar (Enlarged) */}
          {!hideCalendarAndSlider && showCalendarTool && (
            <div className="py-2 px-3 shrink-0 w-[352px] bg-white flex flex-col justify-between overflow-y-auto">
              <div>


                <div className="flex items-center justify-between mb-3">
                  <button onClick={prevCalMonth} disabled={!canPrevCal} aria-label="Previous month" title={canPrevCal ? 'Previous month' : 'No images before this month'}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-display text-sm font-semibold text-gray-900">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </span>
                  <button onClick={nextCalMonth} disabled={!canNextCal} aria-label="Next month" title={canNextCal ? 'Next month' : 'No future months'}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center', alignContent: 'start' }}>
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <span key={i} className="text-[11px] font-semibold text-gray-600 h-4 flex items-center justify-center">{d}</span>
                  ))}
                  {Array.from({ length: calFirstDay }).map((_, i) => <span key={`pad-${i}`} className="h-5" />)}
                  {Array.from({ length: calDaysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const matchIdx = TIMELINE_DATA.findIndex(t => t.date === dateStr);
                    const isHL = matchIdx !== -1;
                    const isSelA = matchIdx === selectedTimelineIndex;
                    const isSelB = isCompareMode && (matchIdx === compareTimelineIndex);
                    const dayCoverage = calendarDates.find(d => d.date === dateStr);

                    let btnStyle = {};
                    let btnClass = '';

                    if (isSelA && isSelB) {
                      btnStyle = { background: 'linear-gradient(135deg, #3F8432 50%, #2563EB 50%)', color: '#FFFFFF' };
                    } else if (isSelA) {
                      btnStyle = { backgroundColor: '#3F8432', color: '#FFFFFF' };
                    } else if (isSelB) {
                      btnStyle = { backgroundColor: '#2563EB', color: '#FFFFFF' };
                    } else if (isHL) {
                      btnClass = 'text-green-700 bg-green-50 hover:bg-green-100 font-bold border border-green-100';
                    } else if (dayCoverage) {
                      btnClass = 'text-gray-500 hover:bg-gray-50 font-semibold';
                    } else {
                      btnClass = 'text-gray-500 cursor-default';
                    }

                    const dayClickable = isCompareMode ? isHL : (isHL || !!dayCoverage);

                    // Multi-sensor days used to only surface the satellite
                    // choice in a separate panel elsewhere on screen — you'd
                    // click a date up here, then have to look away to find
                    // where to actually pick the satellite. Anchoring it as
                    // a callout right on the clicked cell keeps the choice
                    // and its trigger in the same place.
                    const showCallout = satellitePicker?.date === dateStr;
                    // Rows near the bottom of the grid have no room for a
                    // downward callout before the calendar's own overflow
                    // boundary clips it — flip those upward instead.
                    const dayRow = Math.floor((calFirstDay + day - 1) / 7);
                    const openUpward = dayRow >= 3;
                    return (
                      <div key={i} className="relative">
                        <button disabled={!dayClickable}
                          title={dayCoverage ? `Imagery from: ${dayCoverage.sensors.map(s => s === 'sentinel-2' ? 'Sentinel-2' : s === 'landsat' ? 'Landsat' : 'Sentinel-1').join(', ')}` : undefined}
                          onClick={() => {
                            if (isCompareMode) {
                              // Compare mode keeps the simpler current-sensor-only
                              // behavior — picking a satellite for slot A vs B
                              // independently gets confusing fast.
                              if (isHL) {
                                if (activeDateSlot === 'A') setSelectedTimelineIndex(matchIdx);
                                else setCompareTimelineIndex(matchIdx);
                              }
                              return;
                            }
                            if (!dayCoverage) return;
                            if (dayCoverage.sensors.length > 1) {
                              setSatellitePicker(showCallout ? null : { date: dateStr, sensors: dayCoverage.sensors });
                            } else {
                              selectDateWithSensor(dateStr, dayCoverage.sensors[0]);
                            }
                          }}
                          className={`h-6 w-full rounded-md text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${btnClass}`}
                          style={btnStyle}>
                          <span>{day}</span>
                          {dayCoverage && (
                            <span className="flex items-center gap-0.5 leading-none">
                              {dayCoverage.sensors.map(s => (
                                <span key={s} className="w-1 h-1 rounded-full" style={{ backgroundColor: (isSelA || isSelB) ? '#FFFFFF' : SENSOR_DOT_COLOR[s] }} />
                              ))}
                            </span>
                          )}
                        </button>
                        {showCallout && (
                          <div
                            className={`absolute z-50 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 w-max ${
                              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                            }`}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className={`w-2 h-2 bg-white border-gray-200 rotate-45 absolute left-1/2 -translate-x-1/2 ${
                              openUpward ? 'border-r border-b -bottom-1' : 'border-l border-t -top-1'
                            }`} />
                            <span className="text-[11px] font-bold text-gray-600 whitespace-nowrap">Choose satellite</span>
                            <div className="flex gap-1">
                              {satellitePicker.sensors.map(s => (
                                <button
                                  key={s}
                                  onClick={() => { selectDateWithSensor(dateStr, s); setSatellitePicker(null); }}
                                  className="text-[11px] font-bold px-2 py-1 rounded-full text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 whitespace-nowrap"
                                >
                                  {s === 'sentinel-2' ? 'Sentinel-2' : s === 'landsat' ? 'Landsat' : 'Sentinel-1'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {Array.from({ length: calTrailing < 0 ? 0 : calTrailing }).map((_, i) => (
                    <span key={`trail-${i}`} className="h-5" />
                  ))}
                </div>
              </div>


            </div>
          )}

          {/* Vertical key for what each calendar dot color means — the
              calendar itself only shows colored dots per day, with nothing
              nearby explaining which satellite each color is. */}


          {centerContent ? centerContent : (
            <div className="bg-white p-4 flex items-start overflow-hidden border-l border-r border-gray-100">
              {/* Everything about the current selection — which pass is
                  active, how many passes exist this month, and (if a day
                  with more than one sensor was just clicked) the satellite
                  choice — lives in one bordered panel instead of three
                  separate floating pieces. Sized to its content, not
                  stretched to fill the row. One neutral border, one accent
                  color (green) used only for the thing that's actually
                  selected. */}
              <div className="flex flex-col gap-1.5 w-full max-w-[280px] h-fit self-start">
                {isCompareMode ? (
                  <div className="flex flex-col gap-1">
                    {currentTimelineA && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                        <span className="text-[11px] font-bold text-gray-700">A: {currentTimelineA.label?.split(',')[0]}</span>
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-1 py-0.5 rounded shrink-0">
                          {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">{(selectedIndex || 'NDVI').toUpperCase()}</span>
                      </div>
                    )}
                    {currentTimelineB && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        <span className="text-[11px] font-bold text-gray-700">B: {currentTimelineB.label?.split(',')[0]}</span>
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-1 py-0.5 rounded shrink-0">
                          {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">{(selectedIndex || 'NDVI').toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  currentTimeline && (
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[11px] font-semibold text-gray-600">Selected acquisition pass</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] font-bold text-gray-800 tracking-tight">{currentTimeline.label?.split(',')[0]}</span>
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                          {effectiveSensor === 'sentinel-1' ? 'S1 SAR' : effectiveSensor === 'landsat' ? 'L9' : 'S2'}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
                          {(selectedIndex || 'NDVI').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                )}

                <div className="h-px bg-gray-100" />

                {/* Real coverage for the month currently open in the
                    calendar — replaces a static "Best Imagery Active"
                    caption that never changed. */}


                {/* Recent passes — the calendar already has every real
                    acquisition date; surfacing the last few here lets you
                    jump between them without opening it. */}
                {calendarDates.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100" />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-600">Recent passes</span>
                      <div className="flex flex-col gap-1">
                        {calendarDates.slice(-5).reverse().map(d => {
                          const isActive = currentTimeline?.date === d.date;
                          return (
                            <button
                              key={d.date}
                              onClick={() => {
                                if (d.sensors.length > 1) setSatellitePicker({ date: d.date, sensors: d.sensors });
                                else selectDateWithSensor(d.date, d.sensors[0]);
                              }}
                              className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-left transition-colors ${
                                isActive ? 'bg-green-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex items-center gap-0.5 shrink-0">
                                {d.sensors.map(s => (
                                  <span key={s} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SENSOR_DOT_COLOR[s] }} />
                                ))}
                              </span>
                              <span className={`text-[11px] font-semibold ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                                {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  
}
