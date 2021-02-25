import { Selection, scaleLinear, extent, Numeric, line, CurveFactory, curveLinear, select, pointer, Delaunay, dispatch } from 'd3'

const GOOD_COLOR = 'green',
      BAD_COLOR = 'firebrick',
      BASELINE_COLOR = 'gray',
      DATA_COLOR = '#333'

type Accessor = (d: any, i: number) => Numeric

export interface PropertyGetterSetterFunction<TObject, TPropIn, TPropOut = TPropIn> {
  (): TPropOut
  (value: TPropIn): TObject
}

export interface Sparkline {
  (selection: Selection<any | null, any, any, any>): void
  baseline: PropertyGetterSetterFunction<Sparkline, number | ((data: any) => number)>
  better: PropertyGetterSetterFunction<Sparkline, 'lower' | 'higher'>
  domain: PropertyGetterSetterFunction<Sparkline, [number | Date, number | Date] | null, [number, number] | null>
  margin: PropertyGetterSetterFunction<Sparkline, [number, number]>
  on: (typename: string, listener?: ((d:any, i:number) => void)) => Sparkline
  size: PropertyGetterSetterFunction<Sparkline, [number, number]>
  x: PropertyGetterSetterFunction<Sparkline, Accessor>
  y: PropertyGetterSetterFunction<Sparkline, Accessor>
}

export function sparkline(): Sparkline {
  let my: any,
      _baseline: number | ((d: any) => number) = 0,
      _better: 'lower' | 'higher' = 'higher',
      _curve: CurveFactory = curveLinear,
      _domain: [number, number] | null = null,
      _margin: [number, number] = [4, 4],
      _size: [number, number] = [180, 40], // smallest sensible size for a bootstrap container
      _x: Accessor = (_d: any, i: number) => i,
      _y: Accessor = (d: any) => d as number,
      _dispatch = dispatch('highlight')

  my = (selection: Selection<any | null, any, any, any>) => {
    selection.each(function(this: any, data) {
      if (!data.length) {
        return
      }

      let context: Selection<any | null, any, any, any> = select(this).select('.sparkline')
      
      if (!context.node()) {
        context = select(this)
                    .append('g')
                    .attr('class', 'sparkline')
                    .attr('transform', `translate(${_margin[0]},${_margin[1]})`)

        context.append('line')
          .attr('class', 'baseline')
          .attr('stroke', BASELINE_COLOR)
          .attr('stroke-width', 3)
          .attr('stroke-linecap', 'round')
  
        context.append('path')
          .attr('class', 'data-line')
          .attr('stroke', DATA_COLOR)
          .attr('stroke-width', 3)
          .attr('fill', 'none')
          .attr('stroke-linecap', 'round')
  
        context.append('circle')
          .attr('class', 'last-point')
          .attr('r', 3.5)

        const h = context.append('g')
                          .attr('class', 'highlight')
                          .attr('opacity', 0)

        h.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', 0)
          .attr('y2', _size[1]-_margin[1]*2)
          .attr('stroke-width', 3)
          .attr('stroke-linecap', 'round')
        h.append('circle')
          .attr('r', 3)

        context.append('text')
                .attr('class', 'baseline-label')

        context.append('text')
                .attr('text', 'data-label')

        context.append('rect')
                .attr('class', 'delaunay')
                .attr('transform', `translate(${-_margin[0]},${-_margin[1]})`)
                .attr('fill', 'transparent')
                .attr('width', _size[0])
                .attr('height', _size[1])
      }

      const baseline = typeof _baseline === 'function' ? _baseline(data) : _baseline,
            isGood = (d: any, i: number) => (_better === 'higher' && _y(d, i) >= baseline) || (_better === 'lower' && _y(d, i) <= baseline),
            x = scaleLinear()
                  .domain(_domain || extent(data, _x) as [Numeric, Numeric])
                  .range([0, _size[0]-_margin[0]*2]),
            y = scaleLinear()
                  .domain(extent<Numeric>(data.map(_y).concat([baseline])) as [Numeric, Numeric])
                  .range([_size[1]-_margin[1]*2,0]),
            dataLine = line()
                        .x((d, i) => x(_x(d, i)))
                        .y((d, i) => y(_y(d, i)))
                        .curve(_curve),
            delaunay = Delaunay.from(data, (d, i) => x(_x(d, i)), (d, i) => y(_y(d, i)))
      
      let highlightIndex: number | null = null

      context
        .select('.baseline')
        .datum(baseline)
        .attr('x1', 0)
        .attr('y1', y(baseline))
        .attr('x2', _size[0]-_margin[0]*2)
        .attr('y2', y(baseline))

      context
        .select('.data-line')
        .datum(data)
        .attr('d', dataLine)

      context
        .select('.last-point')
        .datum({ datum: data[data.length-1], index: data.length-1 })
        .attr('cx', d => x(_x(d.datum, d.index)))
        .attr('cy', d => y(_y(d.datum, d.index)))
        .classed('good', d => isGood(d.datum, d.index))
        .classed('bad', d => !isGood(d.datum, d.index))
        .attr('fill', d => isGood(d.datum, d.index) ? GOOD_COLOR : BAD_COLOR)

      context
        .select('.delaunay')
        .on('mouseenter', () => {
          context
            .select('.highlight')
            .attr('opacity', 1)

          context
            .select('.last-point')
            .attr('opacity', 0)
        })
        .on('mousemove', function(event) {
          const [px, py] = pointer(event),
                i = delaunay.find(px, py),
                d = data[i !== null ? i : data.length-1]

          if (i === highlightIndex) {
            return
          }
          highlightIndex = i

          let h = context.select('.highlight')

          h.attr('transform', `translate(${x(_x(d, i))},0)`)
            .classed('good', isGood(d, i))
            .classed('bad', !isGood(d, i))
          
          h.select('line')
            .attr('stroke', isGood(d, i) ? GOOD_COLOR : BAD_COLOR)

          h.select('circle')
            .attr('cy', y(_y(d, i)))
            .attr('fill', isGood(d, i) ? GOOD_COLOR : BAD_COLOR)

          _dispatch.call('highlight', context, d, i)
        })
        .on('mouseleave', () => {
          context
            .select('.highlight')
            .attr('opacity', 0)

          context
            .select('.last-point')
            .attr('opacity', 1)

          highlightIndex = null

          _dispatch.call('highlight', context, data[data.length-1], data.length-1)
        })

        // dispatch even initially to trigger that the last point is highlighted by default
        _dispatch.call('highlight', context, data[data.length-1], data.length-1)

    })
  }

  my.baseline = (value?: number | ((data: any) => number)): Sparkline | number | ((data: any) => number) => {
    if (value === undefined) {
      return _baseline
    }

    _baseline = value
    return my
  }

  my.better = (value?: 'lower' | 'higher'): Sparkline | 'lower' | 'higher' => {
    if (value === undefined) {
      return _better
    }

    _better = value
    return my
  }

  my.domain = (value?: [number | Date, number | Date] | null): Sparkline | [number, number] | null => {
    if (value === undefined) {
      return _domain
    }

    _domain = value === null ? null : [value[0] instanceof Date ? value[0].getTime() : value[0], value[1] instanceof Date ? value[1].getTime() : value[1]]
    return my
  }

  my.margin = (value?: [number, number]): Sparkline | [number, number] => {
    if (value === undefined) {
      return _margin
    }

    _margin = value
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
      return _size
    }

    _size = value
    return my
  }

  my.x = (value?: Accessor): Sparkline | Accessor => {
    if (value === undefined) {
      return _x
    }

    _x = value
    return my
  }

  my.y = (value?: Accessor): Sparkline | Accessor => {
    if (value === undefined) {
      return _y
    }

    _y = value
    return my
  }

  return my as Sparkline
}