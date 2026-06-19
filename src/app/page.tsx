import { Simulator } from "@/components/simulator/Simulator";

export default function Home() {
  return (
    <main className="flex-1 px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <h1 className="text-center text-4xl font-bold text-text-primary">
          Simulateur Crypto
        </h1>
        <Simulator />
      </div>
    </main>
  );
}
