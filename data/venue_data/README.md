# Big 12 Venue Data System

This directory contains structured data about athletics venues for all Big 12 Conference schools.

## Purpose

The venue data system provides a centralized, structured repository of information about athletic facilities across all Big 12 schools. This data is used primarily by the Campus Conflicts agent to detect and resolve scheduling conflicts for shared venues.

## Files

- `venue_schema.json`: JSON Schema definition for the venue data format
- `big12_venues.json`: Actual venue data for all Big 12 schools

## Data Structure

The venue data includes:

- **Venue details**: Name, capacity, location information
- **Sports usage**: Which sports use each venue
- **Priority ordering**: The priority order for scheduling different sports
- **Transition times**: Time required to transition between different sports
- **Availability constraints**: Seasonal restrictions and blackout dates
- **Notes**: Special considerations for each venue

## Integration

This data is used by:

1. **Campus Conflicts Agent**: For detecting and resolving venue conflicts in schedules
2. **FlexTime Module**: Via the `getVenueInfo()` and `getSharedVenueInfo()` methods
3. **Scheduling Algorithms**: For creating optimized schedules that respect venue constraints

## Adding New Venues

To add a new venue:

1. Ensure it follows the schema defined in `venue_schema.json`
2. Add the venue to the appropriate school in `big12_venues.json`
3. Include all required fields (name, sports, priority_order, location)
4. Add any sport-specific transition times if applicable

## Example Usage

```javascript
// In FlexTime module
const venueInfo = await flextime.getVenueInfo('arizona_state');
const sharedVenues = await flextime.getSharedVenueInfo('iowa_state');

// Check if a sport has a dedicated venue
const hasDedicatedVenue = venueInfo.venues.some(venue => 
  venue.sports.length === 1 && venue.sports[0] === 'football'
);

// Get transition time between sports
const basketballToVolleyball = sharedVenues.sharedVenues['Hilton Coliseum'].transition_times['basketball_to_volleyball'];
```

## Maintenance

The venue data should be reviewed and updated:

- Annually before each academic year
- When schools renovate or build new athletic facilities
- When scheduling policies change regarding venue usage
- When transition time requirements are adjusted

## Schema Validation

Use a JSON Schema validator to ensure your venue data conforms to the defined schema before deploying updates. 