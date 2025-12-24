import { jsxRenderer } from 'hono/jsx-renderer'

type RendererData = {
  page?: string
  panelProtected?: boolean
  bootstrap?: unknown
}

export const renderer = jsxRenderer(({ children, title, data }: { children?: any; title?: string; data?: RendererData }) => {
  const context = (data ?? {}) as RendererData

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />

        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#232654" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Aline Andrade" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        <title>{title ?? 'Estúdio Aline Andrade · Agenda Online'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,typography" />
        <link href="/static/style.css" rel="stylesheet" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
      </head>
      <body
        data-page={context.page ?? ''}
        data-panel-protected={context.panelProtected ? 'true' : 'false'}
        className="bg-slate-950 text-white antialiased"
        style={{ fontFamily: 'Instrument Sans, system-ui, sans-serif' }}
      >
        {children}
        <script
          id="bootstrap-data"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              ...((context.bootstrap as object) ?? {}),
              panelProtected: context.panelProtected
            })
          }}
        />
        <script type="module" src="/static/app.js" />
        <script src="/static/pwa-notifications.js" />
        <script src="/static/mobile.js" />
      </body>
    </html>
  )
})
