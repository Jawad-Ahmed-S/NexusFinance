import {
    getCurrentMudarabahCycle,
    getMudarabahCycleHistory,
    getMudarabahAccounts,
  } from "../lib/queries";
  import MudarabahDashboardClient from "./mudarabahDashboardClient";
  
  export default async function MudarabahDashboardPage() {
    const [cycle, history, accounts] = await Promise.all([
      getCurrentMudarabahCycle(),
      getMudarabahCycleHistory(),
      getMudarabahAccounts(),
    ]);
  
    return (
      <MudarabahDashboardClient
        cycle={cycle}
        history={history}
        accounts={accounts}
      />
    );
  }