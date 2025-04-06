# FlexTime Data Storage

This directory contains data stored by the FlexTime module. The types of data that may be stored here include:

1. **Modified Schedules** - Schedules that have been changed from the original data
2. **User Preferences** - Settings and preferences for schedule displays and management
3. **Conflict Resolution Records** - Records of how scheduling conflicts were resolved
4. **Schedule Analytics** - Analytics and metrics about schedule efficiency and constraints

## File Structure

The stored data follows this structure:

```
storage/
├── schedules/           # Modified schedules by sport
│   ├── basketball/
│   ├── football/
│   └── ...
├── conflicts/           # Conflict records
├── preferences/         # User preferences
│   ├── user_1.json
│   └── ...
└── analytics/           # Analytics data
```

## Database Alternative

If configured to use database storage instead of file storage, this directory won't be used, and the data will be stored in the following database tables:

- `flextime_schedules`
- `flextime_conflicts`
- `flextime_preferences`
- `flextime_analytics`

## Data Format

When using file storage, data is stored in JSON format with consistent schema to ensure compatibility with potential future migration to database storage. 