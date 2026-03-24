/**
 * ESPN Integration Module
 * 
 * Fetches NFL schedule, spreads, and live scores from ESPN's free public API.
 * No API key required.
 * 
 * Used by admin batch jobs:
 * - Sync schedule on Monday-Friday
 * - Poll live scores every 15 mins Sunday-Monday
 * - Fetch final scores nightly
 */

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

export async function fetchSchedule(season = 2026) {
  try {
    const response = await fetch(`${ESPN_BASE}/schedule?season=${season}`);
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);

    const data = await response.json();
    const events = data.events || [];

    return events.map((event) => {
      const game = event.competitions?.[0];
      if (!game) return null;

      const awayTeam = game.competitors?.find((c) => c.homeAway === 'away');
      const homeTeam = game.competitors?.find((c) => c.homeAway === 'home');

      return {
        id: event.id,
        name: event.name,
        week: parseInt(event.week?.number || 0),
        away_team: awayTeam?.team?.name,
        away_abbr: awayTeam?.team?.abbreviation,
        home_team: homeTeam?.team?.name,
        home_abbr: homeTeam?.team?.abbreviation,
        kickoff_time: new Date(event.date).toISOString(),
        spread: game.odds?.[0]?.spread || null,
        favorite_team: game.odds?.[0]?.favored?.displayName || null,
        away_final_score: awayTeam?.score || null,
        home_final_score: homeTeam?.score || null,
        status: game.status?.type?.state || 'scheduled',
      };
    }).filter(Boolean);
  } catch (error) {
    console.error('Failed to fetch ESPN schedule:', error);
    throw error;
  }
}

export async function fetchLiveScores() {
  try {
    const response = await fetch(`${ESPN_BASE}/scoreboard`);
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);

    const data = await response.json();
    const events = data.events || [];

    return events
      .filter((event) => {
        const status = event.competitions?.[0]?.status?.type?.state;
        return status === 'in' || status === 'live';
      })
      .map((event) => {
        const game = event.competitions?.[0];
        const awayTeam = game?.competitors?.find((c) => c.homeAway === 'away');
        const homeTeam = game?.competitors?.find((c) => c.homeAway === 'home');

        return {
          id: event.id,
          away_team: awayTeam?.team?.name,
          home_team: homeTeam?.team?.name,
          away_current_score: awayTeam?.score,
          home_current_score: homeTeam?.score,
          status: game?.status?.type?.state,
          last_updated: new Date().toISOString(),
        };
      });
  } catch (error) {
    console.error('Failed to fetch live scores:', error);
    throw error;
  }
}

export async function fetchGameScores(gameId) {
  try {
    const response = await fetch(`${ESPN_BASE}/summary?id=${gameId}`);
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);

    const data = await response.json();
    const game = data.competitions?.[0];
    const awayTeam = game?.competitors?.find((c) => c.homeAway === 'away');
    const homeTeam = game?.competitors?.find((c) => c.homeAway === 'home');

    return {
      id: data.id,
      away_team: awayTeam?.team?.name,
      home_team: homeTeam?.team?.name,
      away_final_score: awayTeam?.score,
      home_final_score: homeTeam?.score,
      status: game?.status?.type?.state,
      spread: game?.odds?.[0]?.spread,
      favorite_team: game?.odds?.[0]?.favored?.displayName,
    };
  } catch (error) {
    console.error(`Failed to fetch game ${gameId}:`, error);
    throw error;
  }
}

export default {
  fetchSchedule,
  fetchLiveScores,
  fetchGameScores,
};
