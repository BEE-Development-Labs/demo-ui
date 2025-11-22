'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import contracts from '@/config/contracts.json';
import tokenABI from '@/abis/tokenABI.json';
import trancheVaultABI from '@/config/abi/TrancheVaultAbi.json';

export default function DepositWithdrawPanel() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('0');
  const { address, isConnected } = useAccount();
  const depositTriggeredRef = useRef(false);
  const withdrawTriggeredRef = useRef(false);
  
  // Fetch USDC balance for deposit
  const { data: usdcBalance, isLoading: isBalanceLoading } = useBalance({
    address: address,
    token: contracts.tokens.USDC as `0x${string}`,
    query: {
      enabled: isConnected && activeTab === 'deposit',
    },
  });

  // Fetch USDC decimals
  const { data: usdcDecimals } = useReadContract({
    address: contracts.tokens.USDC as `0x${string}`,
    abi: tokenABI,
    functionName: 'decimals',
    query: {
      enabled: isConnected && activeTab === 'deposit',
    },
  });

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.tokens.USDC as `0x${string}`,
    abi: tokenABI,
    functionName: 'allowance',
    args: address && isConnected ? [address, contracts.contracts.trancheVault as `0x${string}`] : undefined,
    query: {
      enabled: isConnected && activeTab === 'deposit' && !!address && !!usdcDecimals,
    },
  });

  // Create refs for stable function references
  const depositRef = useRef<ReturnType<typeof useWriteContract>['writeContract'] | null>(null);
  const refetchAllowanceRef = useRef<typeof refetchAllowance | null>(null);

  // Store refetchAllowance in ref for stable reference
  useEffect(() => {
    refetchAllowanceRef.current = refetchAllowance;
  }, [refetchAllowance]);

  // Write contract for approval
  const { writeContract: approveUSDC, data: approveHash, isPending: isApproving } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: isWaitingApproval, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Write contract for deposit
  const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  
  // Store deposit function in ref for stable reference
  useEffect(() => {
    depositRef.current = deposit;
  }, [deposit]);

  // Wait for deposit transaction
  const { isLoading: isWaitingDeposit, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Write contract for yield token approval
  const { writeContract: approveYieldToken, data: approveYieldTokenHash, isPending: isApprovingYieldToken } = useWriteContract();

  // Wait for yield token approval transaction
  const { isLoading: isWaitingYieldTokenApproval, isSuccess: isYieldTokenApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approveYieldTokenHash,
  });

  // Write contract for withdraw
  const { writeContract: withdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();

  // Wait for withdraw transaction
  const { isLoading: isWaitingWithdraw, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Fetch yield token balance for withdraw
  const { data: yieldTokenBalance, isLoading: isYieldTokenBalanceLoading } = useBalance({
    address: address,
    token: contracts.contracts.yieldToken as `0x${string}`,
    query: {
      enabled: isConnected && activeTab === 'withdraw',
    },
  });

  // Fetch yield token symbol
  const { data: yieldTokenSymbol } = useReadContract({
    address: contracts.contracts.yieldToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: activeTab === 'withdraw',
    },
  });

  // Fetch yield token decimals
  const { data: yieldTokenDecimals } = useReadContract({
    address: contracts.contracts.yieldToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: activeTab === 'withdraw',
    },
  });

  // Check current yield token allowance for withdraw
  const { data: currentYieldTokenAllowance, refetch: refetchYieldTokenAllowance } = useReadContract({
    address: contracts.contracts.yieldToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && isConnected ? [address, contracts.contracts.trancheVault as `0x${string}`] : undefined,
    query: {
      enabled: isConnected && activeTab === 'withdraw' && !!address && !!yieldTokenDecimals,
    },
  });

  // Create refs for stable function references for withdraw
  const withdrawRef = useRef<ReturnType<typeof useWriteContract>['writeContract'] | null>(null);
  const refetchYieldTokenAllowanceRef = useRef<typeof refetchYieldTokenAllowance | null>(null);

  // Store refetchYieldTokenAllowance in ref for stable reference
  useEffect(() => {
    refetchYieldTokenAllowanceRef.current = refetchYieldTokenAllowance;
  }, [refetchYieldTokenAllowance]);

  // Store withdraw function in ref for stable reference
  useEffect(() => {
    withdrawRef.current = withdraw;
  }, [withdraw]);

  const handleMaxDeposit = () => {
    if (usdcBalance && typeof usdcDecimals === 'number') {
      const balance = formatUnits(usdcBalance.value, usdcDecimals);
      setAmount(balance);
    }
  };

  const handleMaxWithdraw = () => {
    if (yieldTokenBalance && typeof yieldTokenDecimals === 'number') {
      const balance = formatUnits(yieldTokenBalance.value, yieldTokenDecimals);
      setAmount(balance);
    }
  };

  // Reset deposit trigger ref when approval hash changes
  useEffect(() => {
    if (approveHash) {
      depositTriggeredRef.current = false;
    }
  }, [approveHash]);

  // Reset withdraw trigger ref when approval hash changes
  useEffect(() => {
    if (approveYieldTokenHash) {
      withdrawTriggeredRef.current = false;
    }
  }, [approveYieldTokenHash]);

  // Refetch allowance after approval succeeds and trigger deposit
  useEffect(() => {
    if (isApprovalSuccess && !depositHash && !depositTriggeredRef.current && depositRef.current && refetchAllowanceRef.current) {
      depositTriggeredRef.current = true;
      // Small delay to ensure allowance is updated
      const timer = setTimeout(() => {
        if (refetchAllowanceRef.current) {
          refetchAllowanceRef.current().then(() => {
            // Auto-trigger deposit after approval succeeds
            if (isConnected && address && typeof usdcDecimals === 'number' && amount && parseFloat(amount) > 0 && depositRef.current) {
              const amountInWei = parseUnits(amount, usdcDecimals);
              const trancheVaultAddress = contracts.contracts.trancheVault as `0x${string}`;
              const usdcAddress = contracts.tokens.USDC as `0x${string}`;
              
              depositRef.current({
                address: trancheVaultAddress,
                abi: trancheVaultABI,
                functionName: 'deposit',
                args: [BigInt(0), usdcAddress, amountInWei],
                gas: BigInt(2000000),
              });
            }
          });
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isApprovalSuccess, depositHash, isConnected, address, usdcDecimals, amount]);

  // Refetch yield token allowance after approval succeeds and trigger withdraw
  useEffect(() => {
    if (isYieldTokenApprovalSuccess && !withdrawHash && !withdrawTriggeredRef.current && withdrawRef.current && refetchYieldTokenAllowanceRef.current) {
      withdrawTriggeredRef.current = true;
      // Small delay to ensure allowance is updated
      const timer = setTimeout(() => {
        if (refetchYieldTokenAllowanceRef.current) {
          refetchYieldTokenAllowanceRef.current().then(() => {
            // Auto-trigger withdraw after approval succeeds
            if (isConnected && address && typeof yieldTokenDecimals === 'number' && amount && parseFloat(amount) > 0 && withdrawRef.current) {
              const amountInWei = parseUnits(amount, yieldTokenDecimals);
              const trancheVaultAddress = contracts.contracts.trancheVault as `0x${string}`;
              
              withdrawRef.current({
                address: trancheVaultAddress,
                abi: trancheVaultABI,
                functionName: 'withdraw',
                args: [BigInt(0), amountInWei],
                gas: BigInt(2000000),
              });
            }
          });
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isYieldTokenApprovalSuccess, withdrawHash, isConnected, address, yieldTokenDecimals, amount]);

  const handleDeposit = async () => {
    if (!isConnected || !address || typeof usdcDecimals !== 'number' || !amount || parseFloat(amount) <= 0) {
      return;
    }

    const amountInWei = parseUnits(amount, usdcDecimals);
    const trancheVaultAddress = contracts.contracts.trancheVault as `0x${string}`;
    const usdcAddress = contracts.tokens.USDC as `0x${string}`;

    // Check if approval is needed
    if (!currentAllowance || (typeof currentAllowance === 'bigint' && currentAllowance < amountInWei)) {
      // Approve USDC
      approveUSDC({
        address: usdcAddress,
        abi: tokenABI,
        functionName: 'approve',
        args: [trancheVaultAddress, amountInWei],
      });
    } else {
      // Already approved, proceed with deposit
      deposit({
        address: trancheVaultAddress,
        abi: trancheVaultABI,
        functionName: 'deposit',
        args: [BigInt(0), usdcAddress, amountInWei],
        gas: BigInt(2000000),
      });
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !address || typeof yieldTokenDecimals !== 'number' || !amount || parseFloat(amount) <= 0) {
      return;
    }

    const amountInWei = parseUnits(amount, yieldTokenDecimals);
    const trancheVaultAddress = contracts.contracts.trancheVault as `0x${string}`;
    const yieldTokenAddress = contracts.contracts.yieldToken as `0x${string}`;

    // Check if approval is needed
    if (!currentYieldTokenAllowance || (typeof currentYieldTokenAllowance === 'bigint' && currentYieldTokenAllowance < amountInWei)) {
      // Approve yield token
      approveYieldToken({
        address: yieldTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [trancheVaultAddress, amountInWei],
      });
    } else {
      // Already approved, proceed with withdraw
      withdraw({
        address: trancheVaultAddress,
        abi: trancheVaultABI,
        functionName: 'withdraw',
        args: [BigInt(0), amountInWei],
        gas: BigInt(2000000),
      });
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'deposit'
              ? 'bg-[#2a2a2a] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'withdraw'
              ? 'bg-[#2a2a2a] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Withdraw
        </button>
      </div>
      
      {activeTab === 'deposit' && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">USDC</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isConnected && usdcBalance && typeof usdcDecimals === 'number' && (
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    Balance: {parseFloat(formatUnits(usdcBalance.value, usdcDecimals)).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC
                  </span>
                )}
                <button 
                  onClick={handleMaxDeposit}
                  disabled={!isConnected || !usdcBalance || isBalanceLoading}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-[#1a1a1a] rounded disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Max
                </button>
              </div>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-2xl font-semibold outline-none"
            />
          </div>
          
          {isConnected && usdcBalance && typeof usdcDecimals === 'number' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount</span>
                <span className="font-medium">{amount} USDC</span>
              </div>
              <input
                type="range"
                min="0"
                max={formatUnits(usdcBalance.value, usdcDecimals)}
                step={1 / Math.pow(10, usdcDecimals)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          )}
          
          <div className="text-sm text-gray-400 whitespace-nowrap">
            You will deposit <span className="text-white font-medium">{amount} USDC</span>
          </div>
          
          <button 
            onClick={handleDeposit}
            disabled={
              !isConnected || 
              !amount || 
              parseFloat(amount) <= 0 || 
              isApproving || 
              isWaitingApproval ||
              isDepositing ||
              isWaitingDeposit ||
              !usdcDecimals
            }
            className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDepositing || isWaitingDeposit
              ? 'Depositing...'
              : isApproving || isWaitingApproval 
              ? 'Approving...' 
              : isDepositSuccess
              ? 'Deposit Successful!'
              : isApprovalSuccess
              ? 'Depositing...'
              : currentAllowance && parseFloat(amount) > 0 && typeof usdcDecimals === 'number' && typeof currentAllowance === 'bigint' && currentAllowance >= parseUnits(amount, usdcDecimals)
              ? 'Click to proceed'
              : 'Approve & Deposit'}
          </button>
        </div>
      )}
      
      {activeTab === 'withdraw' && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {yieldTokenSymbol || 'Loading...'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isConnected && yieldTokenBalance && typeof yieldTokenDecimals === 'number' && (
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    Balance: {parseFloat(formatUnits(yieldTokenBalance.value, yieldTokenDecimals)).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })} {yieldTokenSymbol || ''}
                  </span>
                )}
                <button 
                  onClick={handleMaxWithdraw}
                  disabled={!isConnected || !yieldTokenBalance || isYieldTokenBalanceLoading}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-[#1a1a1a] rounded disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Max
                </button>
              </div>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-2xl font-semibold outline-none"
            />
          </div>
          
          {isConnected && yieldTokenBalance && typeof yieldTokenDecimals === 'number' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount</span>
                <span className="font-medium">{amount} {yieldTokenSymbol || ''}</span>
              </div>
              <input
                type="range"
                min="0"
                max={formatUnits(yieldTokenBalance.value, yieldTokenDecimals)}
                step={1 / Math.pow(10, yieldTokenDecimals)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          )}
          
          <div className="text-sm text-gray-400 whitespace-nowrap">
            You will withdraw <span className="text-white font-medium">{amount} {yieldTokenSymbol || ''}</span>
          </div>
          
          <button 
            onClick={handleWithdraw}
            disabled={
              !isConnected || 
              !amount || 
              parseFloat(amount) <= 0 || 
              isApprovingYieldToken ||
              isWaitingYieldTokenApproval ||
              isWithdrawing ||
              isWaitingWithdraw ||
              !yieldTokenDecimals ||
              !yieldTokenBalance ||
              (yieldTokenBalance && typeof yieldTokenDecimals === 'number' && parseFloat(amount) > parseFloat(formatUnits(yieldTokenBalance.value, yieldTokenDecimals)))
            }
            className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isWithdrawing || isWaitingWithdraw
              ? 'Withdrawing...'
              : isApprovingYieldToken || isWaitingYieldTokenApproval
              ? 'Approving...'
              : isWithdrawSuccess
              ? 'Withdraw Successful!'
              : isYieldTokenApprovalSuccess
              ? 'Withdrawing...'
              : currentYieldTokenAllowance && parseFloat(amount) > 0 && typeof yieldTokenDecimals === 'number' && typeof currentYieldTokenAllowance === 'bigint' && currentYieldTokenAllowance >= parseUnits(amount, yieldTokenDecimals)
              ? 'Click to proceed'
              : 'Approve & Withdraw'}
          </button>
        </div>
      )}
    </div>
  );
}
