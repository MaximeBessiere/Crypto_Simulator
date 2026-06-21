function InfoIcon() {
  return (
    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-accent-primary text-xs font-semibold text-accent-primary">
      i
    </span>
  );
}

export function PageHeader() {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-4">
        <span className="hidden h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-accent-primary sm:block" />
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-text-primary sm:text-4xl">
          Simulateur Crypto
        </h1>
        <span className="hidden h-px flex-1 max-w-16 bg-gradient-to-r from-accent-primary to-transparent sm:block" />
      </div>

      <p className="mt-3 text-base font-semibold text-accent-primary sm:text-lg">
        Calculez la performance de votre investissement en cryptomonnaie
      </p>

      <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-text-primary sm:text-base">
        Que vous investissiez en une seule fois ou régulièrement (DCA), combien aurait rapporté
        un investissement en cryptomonnaie ? À partir de l&apos;historique réel des prix, ce
        simulateur calcule le capital investi, le capital final et la performance, selon le
        montant, la fréquence et la période choisis.
      </p>

      <div className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-border-subtle bg-surface px-5 py-4 text-left">
        <InfoIcon />
        <p className="text-sm leading-relaxed text-text-secondary">
          Cet outil a une vocation uniquement pédagogique et illustrative, à partir de données de
          marché réelles mais passées. Il ne constitue ni un conseil en investissement ni une
          promesse de performance future.
        </p>
      </div>
    </header>
  );
}
