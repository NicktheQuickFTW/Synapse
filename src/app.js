// Import tennis tiebreaker routes
const tennisRoutes = require('./tiebreakers/tennis/routes/tennis');

// Add tennis routes
app.use('/api/tennis', tennisRoutes);

// Import tennis tiebreaker component
const TennisTiebreaker = require('./tiebreakers/tennis/components/TennisTiebreaker');

// Add tennis tiebreaker to routes
app.get('/tiebreakers/tennis', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tennis Tiebreaker - XII-OS</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div id="root">
          <TennisTiebreaker />
        </div>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `);
}); 