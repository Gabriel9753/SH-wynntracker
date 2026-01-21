
interface DataPoint {
  timestamp: number;
  value: number | null;
}

export function decimateData(data: DataPoint[], maxPoints: number = 100): DataPoint[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  const decimated: DataPoint[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    decimated.push(data[i]);
  }
  
  if (decimated[decimated.length - 1] !== data[data.length - 1]) {
    decimated.push(data[data.length - 1]);
  }
  
  return decimated;
}

export function getMaxPointsForRange(rangeKey: string): number {
  switch (rangeKey) {
    case 'today':
    case '24h':
      return 144;
    case '3d':
      return 72;
    case '7d':
      return 84;
    case '30d':
      return 120;
    default:
      return 100;
  }
}
