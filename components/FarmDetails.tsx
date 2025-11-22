'use client';

import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import Image from 'next/image';
import contracts from '@/config/contracts.json';
import dataEmitterABI from '@/config/abi/DataEmitterAbi.json';

export default function FarmDetails() {
  // Fetch tranche thickness data
  const { data: trancheThickness, isLoading: isLoadingThickness, error: thicknessError } = useReadContract({
    address: contracts.contracts.dataEmitter as `0x${string}`,
    abi: dataEmitterABI,
    functionName: 'getTrancheThickness',
    args: [contracts.contracts.trancheVault as `0x${string}`],
  });

  // Extract currentStrategyBalance from the response
  // It can be either an array (tuple) or an object with named properties
  let currentStrategyBalance: bigint | undefined = undefined;
  
  if (trancheThickness) {
    if (Array.isArray(trancheThickness)) {
      // If it's an array, currentStrategyBalance is at index 6
      currentStrategyBalance = trancheThickness[6] as bigint | undefined;
    } else if (typeof trancheThickness === 'object' && 'currentStrategyBalance' in trancheThickness) {
      // If it's an object with named properties
      currentStrategyBalance = (trancheThickness as any).currentStrategyBalance as bigint | undefined;
    }
  }
  
  // Format the value - scale down using 18 decimals
  const formattedValue = currentStrategyBalance
    ? parseFloat(formatUnits(currentStrategyBalance, 18))
    : null;
  
  const isLoading = isLoadingThickness;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-4">
        <Image 
          src="/usdc-logo.png" 
          alt="USDC" 
          width={40}
          height={40}
          className="w-10 h-10"
        />
        <h1 className="text-4xl font-bold">USDC Farm</h1>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1 bg-[#2a2a2a] rounded-full text-xs">multi-strategy</span>
        <span className="px-3 py-1 bg-[#2a2a2a] rounded-full text-xs">auto-compounding</span>
        <span className="px-3 py-1 bg-[#2a2a2a] rounded-full text-xs">low-risk</span>
      </div>
      
      <div className="mb-6">
        <div className="text-2xl font-semibold mb-1">
          TOTAL FARM VALUE {isLoading ? 'Loading...' : formattedValue ? `${formattedValue.toFixed(6)} USDC` : '-'}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Tailored for users who like to keep it simple!</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm ml-2">
          <li>Generates yields in the same tokens you deposit, grow what you sow</li>
          <li>APR dynamically scales based on the relative size of this tranche</li>
          <li>Ideal for users seeking to compound their core asset positions</li>
        </ul>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Farm Value Locked:</span>
          <span className="font-medium">
            {isLoading ? 'Loading...' : formattedValue ? `${formattedValue.toFixed(6)} USDC` : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Farm Status:</span>
          <span className="text-green-500 font-medium">Active</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Deposit Fees:</span>
          <span className="font-medium">0%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Withdrawal Fees:</span>
          <span className="font-medium">0%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Performance Fees:</span>
          <span className="font-medium">20%</span>
        </div>
      </div>
    </div>
  );
}

