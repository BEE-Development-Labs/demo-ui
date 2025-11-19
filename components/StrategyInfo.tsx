'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useReadContract } from 'wagmi';
import contracts from '@/config/contracts.json';
import dataEmitterABI from '@/config/abi/DataEmitterAbi.json';
import { useMemo } from 'react';

const colors = ['#ec4899', '#a855f7', '#f59e0b', '#10b981', '#3b82f6'];

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-sm font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function StrategyInfo() {
  // Fetch strategy information from DataEmitter
  const { data: strategyInfo, isLoading } = useReadContract({
    address: contracts.contracts.dataEmitter as `0x${string}`,
    abi: dataEmitterABI,
    functionName: 'getTrancheStrategyInformation',
    args: [contracts.contracts.strategyManager as `0x${string}`],
  });

  // Process the strategy data
  const strategyData = useMemo(() => {
    if (!strategyInfo || !Array.isArray(strategyInfo) || strategyInfo.length < 2) {
      return [];
    }

    const [strategyAddresses, ratios] = strategyInfo as [string[], bigint[]];
    
    // Create a map of address to key name from contracts.json
    const addressToKey: Record<string, string> = {};
    Object.entries(contracts.contracts).forEach(([key, address]) => {
      if (key.startsWith('strategy')) {
        addressToKey[address.toLowerCase()] = key.replace('strategy', '');
      }
    });

    // Convert BPS to percentage and create chart data
    return strategyAddresses.map((address, index) => {
      const ratio = ratios[index];
      const percentage = ratio ? Number(ratio) / 100 : 0; // Convert BPS to percentage
      const strategyKey = addressToKey[address.toLowerCase()] || 'Unknown';
      
      return {
        name: strategyKey,
        value: percentage,
        color: colors[index % colors.length],
        address: address,
      };
    }).filter(item => item.value > 0); // Only include strategies with allocation
  }, [strategyInfo]);

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
      <h2 className="text-lg font-semibold mb-4">Strategy Information</h2>
      
      <p className="text-sm text-gray-300 mb-6 leading-relaxed">
        The non-custodial vault maximizes yield farming on Base, automatically routes funds, 
        focuses on stablecoins and derivatives, charges only a performance fee, and has flexible 
        deposits/withdrawals with an initial "deposit cost" for on-chain fees.
      </p>
      
      <button className="mb-8 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-sm transition-colors">
        Learn More
      </button>
      
      <div className="flex justify-center">
        {/* Strategy Breakdown Chart */}
        <div className="w-full max-w-md">
          <h3 className="text-sm font-semibold mb-4 text-center">Strategy Breakdown</h3>
          <div className="flex flex-col items-center">
            {isLoading ? (
              <div className="text-gray-400 text-sm">Loading...</div>
            ) : strategyData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={strategyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={strategyData.length > 1 ? 2 : 0}
                      dataKey="value"
                      label={renderCustomLabel}
                    >
                      {strategyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-4 w-full space-y-2">
                  {strategyData.map((strategy, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-[#2a2a2a] p-3 rounded-lg">
                      <span className="text-gray-400">{strategy.name}:</span>
                      <span className="text-gray-300">{strategy.value.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm">No strategy data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

