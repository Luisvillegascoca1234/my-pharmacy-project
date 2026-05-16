import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-16 text-center">
      <p className="mb-3 text-sm font-medium text-fd-muted-foreground">Pharmacy POS</p>
      <h1 className="mx-auto max-w-3xl text-3xl font-semibold tracking-normal sm:text-5xl">
        Documentacion tecnica y operativa para farmacia
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base text-fd-muted-foreground sm:text-lg">
        Guias para procesos de dispensacion, inventario, ventas, facturacion, auditoria y
        administracion del sistema.
      </p>
      <div className="mt-8">
        <Link
          href="/docs"
          className="inline-flex h-10 items-center justify-center rounded-md bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground"
        >
          Abrir documentacion
        </Link>
      </div>
    </main>
  );
}
