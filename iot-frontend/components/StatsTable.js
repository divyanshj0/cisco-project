'use client';

export default function StatsTable({ stats, loading }) {
  const formatValue = (value) => {
    return value !== null && value !== undefined ? Number(value).toFixed(2) : 'N/A';
  };

  const tempStats = {
    min: formatValue(stats?.minTemp),
    max: formatValue(stats?.maxTemp),
    avg: formatValue(stats?.avgTemp),
  };

  const humidStats = {
    min: formatValue(stats?.minHum),
    max: formatValue(stats?.maxHum),
    avg: formatValue(stats?.avgHum),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
        <thead className="bg-black">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Metric</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Min</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Max</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Mean/Average</th>
          </tr>
        </thead>
        <tbody >
          <tr className="odd:bg-gray-500 even:bg-gray-300">
            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">Temperature (°C)</td>
            <td className="px-6 py-4 whitespace-nowrap">{tempStats.min}</td>
            <td className="px-6 py-4 whitespace-nowrap">{tempStats.max}</td>
            <td className="px-6 py-4 whitespace-nowrap">{tempStats.avg}</td>
          </tr>
          <tr className="odd:bg-gray-600 even:bg-gray-400">
            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">Humidity (%)</td>
            <td className="px-6 py-4 whitespace-nowrap">{humidStats.min}</td>
            <td className="px-6 py-4 whitespace-nowrap">{humidStats.max}</td>
            <td className="px-6 py-4 whitespace-nowrap">{humidStats.avg}</td>
          </tr>
        </tbody>
        <tfoot className="bg-gray-50">
            <tr>
                <td colSpan="4" className="px-6 py-3 text-sm text-center text-gray-600">
                    Total Readings in Period: <span className="font-bold">{stats?.readingCount || 0}</span>
                </td>
            </tr>
        </tfoot>
      </table>
    </div>
  );
}