# Basketball Transfer Portal Agent

An intelligent agent for tracking and analyzing basketball transfer portal data, with integration to Notion databases.

## Features

- Scrapes transfer portal data from multiple sources
- Integrates with Notion for data storage and visualization
- Provides analytics and insights on transfer trends
- Automated daily updates
- Configurable data fields and sources

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/basketball-transfer-portal-agent.git
cd basketball-transfer-portal-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your credentials:
```bash
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id
```

4. Start the agent:
```bash
npm start
```

## Project Structure

```
├── src/
│   ├── index.js           # Entry point
│   ├── config/            # Configuration files
│   │   ├── notion.js      # Notion integration
│   │   ├── scraper.js     # Data scraping
│   │   └── analytics.js   # Data analysis
│   ├── models/            # Data models
│   └── utils/             # Helper utilities
├── tests/                 # Test files
└── scripts/              # Utility scripts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.