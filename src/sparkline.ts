import { Selection, scaleLinear, extent, Numeric, line, CurveFactory, curveLinear, pointer, Delaunay, dispatch } from 'd3'

type Accessor = (d: any, i: number) => Numeric
type StringAccessor = (d: any) => string
type Formatter = ((n: number | { valueOf(): number }) => string)
type LayoutEnum = 'top' | 'left' | 'simple'

interface PropertyGetterSetterFunction<TObject, TPropIn, TPropOut = TPropIn> {
  (): TPropOut
  (value: TPropIn): TObject
}

const GOOD_COLOR = 'forestgreen',
      BAD_COLOR = 'crimson',
      BASELINE_COLOR = 'gray',
      DATA_COLOR = '#333',
      NEUTRAL_COLOR = 'steelblue',
      LEFT_OFFSET_PCT = 0.25,
      TOP_OFFSET_PCT = 0.5

export interface Sparkline {
  (selection: Selection<any | null, any, any, any>): void
  baseline: PropertyGetterSetterFunction<Sparkline, number | ((data: any) => number | null) | null, ((data: any) => number | null)>
  baselineLabel: PropertyGetterSetterFunction<Sparkline, StringAccessor | string, StringAccessor>
  better: PropertyGetterSetterFunction<Sparkline, 'lower' | 'higher'>
  data: PropertyGetterSetterFunction<Sparkline, ((d: any, i: number) => any[])>
  dataFormat: PropertyGetterSetterFunction<Sparkline, Formatter | null, Formatter>
  domain: PropertyGetterSetterFunction<Sparkline, [number | Date, number | Date] | null, [number, number] | null>
  domainFormat: PropertyGetterSetterFunction<Sparkline, Formatter | null, Formatter>
  layout: PropertyGetterSetterFunction<Sparkline, LayoutEnum>
  margin: PropertyGetterSetterFunction<Sparkline, [number, number]>
  offset: PropertyGetterSetterFunction<Sparkline, number | null>
  on: (typename: string, listener?: ((d:any, i:number, extra: { isGood: boolean | null, data: any[] }) => void) | null) => Sparkline
  size: PropertyGetterSetterFunction<Sparkline, [number, number]>
  title: PropertyGetterSetterFunction<Sparkline, StringAccessor | string, StringAccessor>
  x: PropertyGetterSetterFunction<Sparkline, Accessor>
  xLabel: PropertyGetterSetterFunction<Sparkline, StringAccessor | string, StringAccessor>
  y: PropertyGetterSetterFunction<Sparkline, Accessor>
  yLabel: PropertyGetterSetterFunction<Sparkline, StringAccessor | string, StringAccessor>
}

export function sparkline(): Sparkline {
  let my: any,
      _baseline: ((d: any) => number | null) = () => null,
      _better: 'lower' | 'higher' = 'higher',
      _curve: CurveFactory = curveLinear,
      _data: ((d: any) => any[]) = d => d,
      _domain: [number, number] | null = null,
      _layout: LayoutEnum = 'left',
      _margin: [number, number] = [6, 6],
      _offset: number | null = null,
      _size: [number, number] = [360, 40], // small, sensible size for a bootstrap container
      _annotationSize: [number, number] = [86, 28],
      _chartSize: [number, number] = [262, 28],
      _x: Accessor = (_d: any, i: number) => i,
      _y: Accessor = (d: any) => d as number,
      _baselineLabel: StringAccessor = () => '',
      _dataFormat: Formatter = (n: number) => n.toFixed(0), 
      _domainFormat: Formatter = (n: number) => n.toFixed(0),
      _title: StringAccessor = () => '',
      _xLabel: StringAccessor = (d: string) => d.toString(),
      _yLabel: StringAccessor = (d: string) => d.toString(),
      _dispatch = dispatch('highlight', 'unhighlight')

  my = (selection: Selection<any | null, any, any, any>) => {

    const datum = selection.datum(),
          data = _data(datum)

    if (!data.length) {
      return
    }

    const baseline = _baseline(datum),
          isGood = (d: any, i: number) => baseline === null ? null : ((_better === 'higher' && _y(d, i) >= baseline) || (_better === 'lower' && _y(d, i) <= baseline)),
          x = scaleLinear()
                .domain(_domain || extent(data, _x) as [Numeric, Numeric])
                .range([0, _chartSize[0]]),
          y = scaleLinear()
                .domain(extent<Numeric>(data.map(_y).concat([baseline as Numeric])) as [Numeric, Numeric])
                .range([_chartSize[1], 0]),
          dataLine = line()
                      .x((d, i) => x(_x(d, i)))
                      .y((d, i) => y(_y(d, i)))
                      .curve(_curve),
          delaunay = Delaunay.from(data, (d, i) => x(_x(d, i)), (d, i) => y(_y(d, i)))

    let highlightIndex: number | null = null

    const context = selection.selectAll('.sparkline')
              .data([data])
              .join(enter => {
                const container = enter.append('g')
                                        .attr('class', 'sparkline')
                                        .attr('transform', `translate(${_margin[0]},${_margin[1]})`)

                const annotation = container.append('g')
                                            .attr('class', 'annotation')
                                            .attr('font-family', 'sans-serif')

                annotation.append('text')
                        .attr('class', 'title')
                        .attr('text-anchor', 'start')
                        .attr('dominant-baseline', 'hanging')
                        .attr('fill', DATA_COLOR)
                        .attr('font-size', _annotationSize[1]*0.35)

                annotation.append('text')
                        .attr('class', 'x-label')
                        .attr('text-anchor', 'start')
                        .attr('dominant-baseline', 'hanging')
                        .attr('fill', DATA_COLOR)
                        .attr('font-size', _annotationSize[1]*0.4)
                        .attr('opacity', 0)

                annotation.append('text')
                        .attr('class', 'y-label')
                        .attr('font-weight', 'bold')
                        .attr('text-anchor', _layout === 'left' ? 'start' : 'end')
                        .attr('x', _layout === 'left' ? 0 : _annotationSize[0])
                        .attr('y', _annotationSize[1]*0.5)
                        .attr('dominant-baseline', _layout === 'left' ? 'hanging' : 'middle')
                        .attr('fill', DATA_COLOR)
                        .attr('font-size', _annotationSize[1]*0.5)

                annotation.append('text')
                        .attr('class', 'baseline-label')
                        .attr('text-anchor', _layout === 'left' ? 'end' : 'start')
                        .attr('x', _layout === 'left' ? _annotationSize[0]*0.95 : 0)
                        .attr('y', _annotationSize[1])
                        .attr('fill', BASELINE_COLOR)
                        .attr('font-size', _annotationSize[1]*0.3)

                const chart = container.append('g')
                                        .attr('class', 'chart')

                chart.append('line')
                      .attr('class', 'baseline')
                      .attr('stroke', BASELINE_COLOR)
                      .attr('stroke-width', 3)
                      .attr('stroke-linecap', 'round')
          
                chart.append('path')    
                      .attr('class', 'data-line')
                      .attr('stroke', DATA_COLOR)
                      .attr('stroke-width', 3)
                      .attr('fill', 'none')
                      .attr('stroke-linecap', 'round')
          
                chart.append('circle')
                      .attr('class', 'last-point')
                      .attr('stroke', DATA_COLOR)
                      .attr('stroke-width', 1.5)
                      .attr('r', 3.5)

                const highlight = chart.append('g')
                                        .attr('class', 'highlight')
                                        .attr('opacity', 0)

                highlight.append('line')
                          .attr('x1', 0)
                          .attr('y1', 0)
                          .attr('x2', 0)
                          .attr('y2', _chartSize[1])
                          .attr('stroke-width', 3)
                          .attr('stroke-linecap', 'round')
                
                highlight.append('circle')
                          .attr('r', 3.5)
                          .attr('stroke', DATA_COLOR)
                          .attr('stroke-width', 1.5)

                chart.append('rect')
                        .attr('class', 'delaunay')
                        .attr('fill', 'transparent')
                        .attr('width', _chartSize[0])
                        .attr('height', _chartSize[1])

                return container
              })

    const annotation = context.selectAll('.annotation'),
          chart = context.selectAll('.chart')

    switch (_layout) {
      case 'left':
        annotation.attr('opacity', 1)
        chart.attr('transform', `translate(${_annotationSize[0]},0)`)
        break
      case 'top':
        annotation.attr('opacity', 1)
        chart.attr('transform', `translate(0,${_annotationSize[1]})`)
        break
      case 'simple':
        annotation.attr('opacity', 0)
        chart.attr('transform', `translate(0,0)`)
        break
    }

    annotation.select('.title')
              .text(_title(data))
        
    annotation.select('.baseline-label')
              .text(_baselineLabel(data))

    annotation.select('.y-label')
              .text(_yLabel(_dataFormat(_y(data[data.length-1], data.length-1))))
              .attr('fill', isGood(data[data.length-1], data.length-1) === null ? NEUTRAL_COLOR :
                            isGood(data[data.length-1], data.length-1) ? GOOD_COLOR : BAD_COLOR)
  
    if (baseline !== null) {
      chart
        .select('.baseline')
        .datum(baseline)
        .attr('x1', 0)
        .attr('y1', y(baseline))
        .attr('x2', _chartSize[0])
        .attr('y2', y(baseline))
        .attr('opacity', 1)
    } else {
      chart
        .select('.baseline')
        .attr('opacity', 0)
    }

    chart
      .select('.data-line')
      .datum(data)
      .attr('d', dataLine)

    chart
      .select('.last-point')
      .datum({ datum: data[data.length-1], index: data.length-1 })
      .attr('cx', d => x(_x(d.datum, d.index)))
      .attr('cy', d => y(_y(d.datum, d.index)))
      .classed('good', d => isGood(d.datum, d.index) === true)
      .classed('bad', d => isGood(d.datum, d.index) === false)
      .attr('fill', d => isGood(d.datum, d.index) ? GOOD_COLOR : isGood(d.datum, d.index) === false ? BAD_COLOR : NEUTRAL_COLOR)

    chart
      .select('.delaunay')
      .on('mouseenter', () => {
        annotation.select('.title').attr('opacity', 0)
        annotation.select('.x-label').attr('opacity', 1)

        chart
          .select('.highlight')
          .attr('opacity', 1)

        chart
          .select('.last-point')
          .attr('opacity', 0)
      })
      .on('mousemove', function(event) {
        const [px, py] = pointer(event),
              i = delaunay.find(px, py),
              d = data[i !== null ? i : data.length-1],
              good = isGood(d, i),
              goodColor = good === null ? NEUTRAL_COLOR : good ? GOOD_COLOR : BAD_COLOR

        if (i === highlightIndex) {
          return
        }
        highlightIndex = i

        annotation.select('.x-label')
            .text(_xLabel(_domainFormat(_x(d, i))))

        annotation.select('.y-label')
            .text(_yLabel(_dataFormat(_y(d, i))))
            .attr('fill', goodColor)

        let h = chart.select('.highlight')

        h.attr('transform', `translate(${x(_x(d, i))},0)`)
          .classed('good', good === true)
          .classed('bad', good === false)
        
        h.select('line')
          .attr('stroke', goodColor)

        h.select('circle')
          .attr('cy', y(_y(d, i)))
          .attr('fill', goodColor)

        _dispatch.call('highlight', context, d, i, { 
                                                      isGood: good,
                                                      data: data
                                                    })
      })
      .on('mouseleave', () => {
        annotation.select('.title').attr('opacity', 1)
        annotation.select('.x-label').attr('opacity', 0)
        annotation.select('.y-label')
                  .text(_yLabel(_dataFormat(_y(data[data.length-1], data.length-1))))
                  .attr('fill', isGood(data[data.length-1], data.length-1) === null ? NEUTRAL_COLOR :
                                isGood(data[data.length-1], data.length-1) ? GOOD_COLOR : BAD_COLOR)

        chart
          .select('.highlight')
          .attr('opacity', 0)

        chart
          .select('.last-point')
          .attr('opacity', 1)

        highlightIndex = null

        _dispatch.call('unhighlight', context, data[data.length-1], data.length-1,
                                                { 
                                                  isGood: isGood(data[data.length-1], data.length-1),
                                                  data: data
                                                })
      })

      // dispatch event initially to trigger that the last point is highlighted by default
      _dispatch.call('unhighlight', context, data[data.length-1], data.length-1,
                                              { 
                                                isGood: isGood(data[data.length-1], data.length-1),
                                                data: data
                                              })

  }

  my.baseline = (value?: number | ((data: any) => number)): Sparkline | number | ((data: any) => number | null) => {
    if (value === undefined) {
      return _baseline
    }

    _baseline = value === null || typeof value !== 'function' ? () => value : value
    return my
  }

  my.baselineLabel = (value?: StringAccessor | string): Sparkline | StringAccessor => {
    if (value === undefined) {
      return _baselineLabel
    }

    _baselineLabel = typeof value === 'function' ? value : () => value
    return my
  }

  my.better = (value?: 'lower' | 'higher'): Sparkline | 'lower' | 'higher' => {
    if (value === undefined) {
      return _better
    }

    _better = value
    return my
  }

  my.data = (value?: ((d: any) => any[])): Sparkline | ((d: any) => any[]) => {
    if (value === undefined) {
      return _data
    }

    _data = value
    return my
  }

  my.dataFormat = (value?: Formatter | null): Sparkline | Formatter => {
    if (value === undefined) {
      return _dataFormat
    }

    _dataFormat = value || ((n: number) => n.toString())
    return my
  }

  my.domain = (value?: [number | Date, number | Date] | null): Sparkline | [number, number] | null => {
    if (value === undefined) {
      return _domain
    }

    _domain = value === null ? null : [value[0] instanceof Date ? value[0].getTime() : value[0], value[1] instanceof Date ? value[1].getTime() : value[1]]
    return my
  }

  my.domainFormat = (value?: Formatter | null): Sparkline | Formatter => {
    if (value === undefined) {
      return _domainFormat
    }

    _domainFormat = value || ((n: number) => n.toString())
    return my
  }

  my.layout = (value?: LayoutEnum): Sparkline | LayoutEnum => {
    if (value === undefined) {
      return _layout
    }

    _layout = value
    my.size(_size)

    return my
  }

  my.margin = (value?: [number, number]): Sparkline | [number, number] => {
    if (value === undefined) {
      return _margin
    }

    _margin = value
    my.size(_size)

    return my
  }

  my.offset = (value?: number | null): Sparkline | number | null => {
    if (value === undefined) {
      return _offset
    }

    _offset = value
    my.size(_size)

    return my
  }

  my.on = (typename: string, listener: ((d:any, i:number) => void) | null = null): Sparkline => {
    if (!listener) {
      _dispatch.on(typename, null)
    } else {
      _dispatch.on(typename, listener)
    }

    return my
  }

  my.size = (value?: [number, number]): Sparkline | [number, number] => {
    if (value === undefined) {
      return [_size[0]+_margin[0]*2, _size[1]+_margin[1]*2]
    }

    _size = [value[0]-_margin[0]*2, value[1]-_margin[1]*2]
    
    switch (_layout) {
      case 'left':
        _annotationSize = [_size[0]*(_offset || LEFT_OFFSET_PCT), _size[1]]
        _chartSize = [_size[0]*(1-(_offset || LEFT_OFFSET_PCT)), _size[1]]
        break
      case 'top':
        _annotationSize = [_size[0], _size[1]*(_offset || TOP_OFFSET_PCT)]
        _chartSize = [_size[0], _size[1]*(1-(_offset || TOP_OFFSET_PCT))]
        break
      case 'simple':
        _annotationSize = [0, 0]
        _chartSize = _size
        break
    }

    return my
  }

  my.title = (value?: StringAccessor | string): Sparkline | StringAccessor => {
    if (value === undefined) {
      return _title
    }

    _title = typeof value === 'function' ? value : () => value
    return my
  }

  my.x = (value?: Accessor): Sparkline | Accessor => {
    if (value === undefined) {
      return _x
    }

    _x = value
    return my
  }

  my.xLabel = (value?: StringAccessor | string): Sparkline | StringAccessor => {
    if (value === undefined) {
      return _xLabel
    }

    _xLabel = typeof value === 'function' ? value : () => value

    return my
  }

  my.y = (value?: Accessor): Sparkline | Accessor => {
    if (value === undefined) {
      return _y
    }

    _y = value
    return my
  }

  my.yLabel = (value?: StringAccessor | string): Sparkline | StringAccessor => {
    if (value === undefined) {
      return _yLabel
    }

    _yLabel = typeof value === 'function' ? value : () => value
    return my
  }

  return my as Sparkline
}