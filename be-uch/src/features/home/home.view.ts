export function getHomeHTML(): string {
  return `<!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UCH Connection API</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            background: #ffffff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 12px;
          }
          
          .container {
            max-width: 500px;
            width: 100%;
            text-align: center;
          }
          
          h1 {
            color: #1e3a8a;
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .subtitle {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 24px;
            font-weight: 400;
          }
          
          .btn {
            display: inline-block;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.2s ease;
            margin: 8px;
          }
          
          .btn-primary {
            background: #1e3a8a;
            color: white;
          }
          
          .btn-primary:hover {
            background: #1e40af;
          }
          
          .btn-secondary {
            background: transparent;
            color: #1e3a8a;
            border: 2px solid #1e3a8a;
          }
          
          .btn-secondary:hover {
            background: #f8fafc;
          }
          
          footer {
            margin-top: 30px;
            color: #94a3b8;
            font-size: 13px;
          }
          
          @media (max-width: 600px) {
            h1 {
              font-size: 28px;
            }
            
            .btn {
              display: block;
              margin: 8px 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>UCH Connection API</h1>
          <p class="subtitle">Managed by UCH Development Service</p>
          <div>
            <a href="/api/swagger" class="btn btn-primary">API Documentation</a>
            <a href="/api/health" class="btn btn-secondary">Health Check</a>
          </div>
          <footer>
            <p>Powered by Elysia.js</p>
          </footer>
        </div>
      </body>
    </html>`;
}
