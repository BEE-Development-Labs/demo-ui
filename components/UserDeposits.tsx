'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import contracts from '@/config/contracts.json';
import dataEmitterABI from '@/config/abi/DataEmitterAbi.json';

export default function UserDeposits() {
  const { address, isConnected } = useAccount();

  // Fetch user tranche position
  const { data: userPosition, isLoading, error } = useReadContract({
    address: contracts.contracts.dataEmitter as `0x${string}`,
    abi: dataEmitterABI,
    functionName: 'calculateUserTranchePosition',
    args: address && isConnected 
      ? [
          address,
          contracts.contracts.trancheVault as `0x${string}`,
          contracts.contracts.strategyManager as `0x${string}`,
        ]
      : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Extract assetBalance from the response (first element)
  let assetBalance: bigint | undefined = undefined;
  if (userPosition) {
    if (Array.isArray(userPosition)) {
      assetBalance = userPosition[0] as bigint | undefined;
    } else if (typeof userPosition === 'object' && 'assetBalance' in userPosition) {
      assetBalance = (userPosition as any).assetBalance as bigint | undefined;
    }
  }

  // Format the value with 18 decimals
  const formattedValue = assetBalance
    ? parseFloat(formatUnits(assetBalance, 18))
    : null;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Your Deposits</h2>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>ASSETS SHOWN IN</span>
          <span className="px-2 py-1 bg-[#2a2a2a] rounded">USDC</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Current Farm Value:</span>
          <span className="font-medium">
            {!isConnected 
              ? 'Connect Wallet' 
              : isLoading 
              ? 'Loading...' 
              : formattedValue 
              ? `${formattedValue.toFixed(6)} USDC` 
              : '-'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Net Base Yield Return:</span>
          <span className="font-medium">-%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Net Return:</span>
          <span className="font-medium">-%</span>
        </div>
      </div>
    </div>
  );
}

