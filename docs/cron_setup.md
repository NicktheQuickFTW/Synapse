# Setting Up Daily Transfer Portal Data Sync

This document explains how to set up a daily cron job that will:
1. Run the basketball transfer portal agents to collect data
2. Sync the collected data to your Notion database

## Prerequisites

- Your XII-OS environment must be fully set up and working
- The transfer portal agents must run successfully manually
- The Notion integration must be configured

## Setting Up the Cron Job

### 1. Test the Daily Sync Script

First, test the daily sync script manually to ensure it works correctly:

```bash
cd /path/to/your/XII-OS
./modules/transfer-portal/scripts/daily_transfer_portal_sync.sh
```

Make sure it runs without errors and successfully syncs data to Notion.

### 2. Configure Cron

1. Open your crontab for editing:

```bash
crontab -e
```

2. Add a line to run the script daily at a specific time (e.g., 2 AM):

```
0 2 * * * cd /path/to/your/XII-OS && ./modules/transfer-portal/scripts/daily_transfer_portal_sync.sh >> /path/to/your/XII-OS/logs/cron_sync.log 2>&1
```

Replace `/path/to/your/XII-OS` with the absolute path to your XII-OS installation.

3. Save and exit the editor.

### 3. Verify the Cron Job

- Check that the cron job has been added:

```bash
crontab -l
```

- After the first scheduled run, check the log file to ensure it ran successfully:

```bash
cat /path/to/your/XII-OS/logs/cron_sync.log
```

## Customizing the Sync Schedule

- To change the schedule, edit your crontab and modify the cron expression.
- For example, to run at 3:30 AM instead of 2 AM:

```
30 3 * * * cd /path/to/your/XII-OS && ./modules/transfer-portal/scripts/daily_transfer_portal_sync.sh >> /path/to/your/XII-OS/logs/cron_sync.log 2>&1
```

## Troubleshooting

If the cron job fails:

1. Check the log file for error messages
2. Ensure all paths are absolute paths in the crontab
3. Verify that the user running the cron job has permissions to all required files
4. Make sure environment variables are properly set in the script

## Log File Rotation

To prevent log files from growing too large:

1. Install logrotate if not already installed
2. Create a config file at `/etc/logrotate.d/xii-os-cron`:

```
/path/to/your/XII-OS/logs/cron_sync.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

This will keep logs for 7 days and compress older logs. 