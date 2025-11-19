import Header from '@/components/Header';
import FarmDetails from '@/components/FarmDetails';
import DepositWithdrawPanel from '@/components/DepositWithdrawPanel';
import UserDeposits from '@/components/UserDeposits';
import StrategyInfo from '@/components/StrategyInfo';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Farm Details */}
          <div className="lg:col-span-2 space-y-6">
            <FarmDetails />
            <StrategyInfo />
          </div>
          
          {/* Right Column - Deposit/Withdraw and User Deposits */}
          <div className="space-y-6">
            <DepositWithdrawPanel />
            <UserDeposits />
          </div>
        </div>
      </div>
    </div>
  );
}
