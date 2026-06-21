import { PageHeader } from "@/components/PageHeader";
import { Simulator } from "@/components/simulator/Simulator";

export default function Home() {
  return (
    <main className="flex-1 px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <PageHeader />
        <Simulator />
      </div>
    </main>
  );
}
