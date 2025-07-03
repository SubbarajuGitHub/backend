import { insertAnalyticsEvent } from '../db/Tracking.js';
import { eventSchema } from '../models/Event.js';
import { db } from "../config/database.js"
import { generateVisitorId, get30MinSlotTime, getDailySalt } from '../utils/constants.js';
import { getClientDetails } from '../utils/tracker.js';


export async function receiveEvent(req, res) {
  const value = req.body.events;
  console.log("value", value)
  const clientInfo = await getClientDetails(req);
  const ip = clientInfo.ip;
  const userAgent = clientInfo['user-agent'];
  const websiteId = value.websiteId ?? "";
  const salt = getDailySalt();
  // const visitorId = generateVisitorId(websiteId, ip, userAgent, salt);
  const visitorId = "210fb2809f995395d899083abd0c3db05df6ceceb68579b9e1ff1d31762f4428"
  const now = new Date();
  const sessionSlotTime = get30MinSlotTime();
 // const sessionId = generateVisitorId(visitorId, sessionSlotTime, '', '');
  const sessionId = "db98e652f2db4f62d798d7cabbce3cb2fea48c95a1ba30633fb39e8484c14d8c"

  // Step 1: Check if 24-hour visitor exists
  const { rows: visitorRows } = await db.query(
    `SELECT id FROM unique_visitors WHERE id = $1`,
    [visitorId]
  );
  const visitorExists = visitorRows.length > 0;

  // Step 2: Check if 30-minute session exists
  const { rows: sessionRows } = await db.query(
    `SELECT id FROM visitor_sessions WHERE id = $1`,
    [sessionId]
  );
  const sessionExists = sessionRows.length > 0;

  // === Case 1: New unique visitor and session
  if (!visitorExists && !sessionExists) {
    await db.query(`
      INSERT INTO unique_visitors(id, website_id, ip, user_agent, session_salt, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [visitorId, websiteId, ip, userAgent, salt, now]);

    await db.query(`
      INSERT INTO visitor_sessions(id, visitor_id, started_at, last_seen_at, page_count)
      VALUES ($1, $2, $3, $4, 1)
    `, [sessionId, visitorId, now, now]);
    
    await insertAnalyticsEvent(websiteId, sessionId, value, userAgent);
    
    return res.status(200).json({
      message: 'New visitor & session created',
      visitorId,
      sessionId,
      increment: { uniqueVisitors: 1, totalVisits: 1, pageCount: 1 }
    });
  }

  // === Case 2: Visitor exists but session does not
  if (visitorExists && !sessionExists) {
    await db.query(`
      INSERT INTO visitor_sessions(id, visitor_id, started_at, last_seen_at, page_count)
      VALUES ($1, $2, $3, $4, 1)
    `, [sessionId, visitorId, now, now]);

    await insertAnalyticsEvent(websiteId, sessionId, value, userAgent);

    return res.status(200).json({
      message: 'New session for existing visitor',
      visitorId,
      sessionId,
      increment: { uniqueVisitors: 0, totalVisits: 1, pageCount: 1 }
    });
  }

  // === Case 3: Both visitor and session exist → Only update page count
  if (visitorExists && sessionExists) {
    await db.query(`
      UPDATE visitor_sessions
      SET page_count = page_count + 1, last_seen_at = $2
      WHERE id = $1
    `, [sessionId, now]);

    // DO NOT insert event in this case
    return res.status(200).json({
      message: 'Session page count updated',
      visitorId,
      sessionId,
      increment: { uniqueVisitors: 0, totalVisits: 0, pageCount: 1 }
    });
  }
}

export async function getEvents(req, res) {
  try {
    const [
      uniqueVisitors,
      sessionStats,
      topChannels,
      topEntryPages,
      topExitPages,
      countries,
      browsers
    ] = await Promise.all([
      db.query(`
        SELECT COUNT(DISTINCT id) AS unique_visitor_count
        FROM unique_visitors;
      `),

      db.query(`
        SELECT 
          COUNT(DISTINCT id) AS visitor_sessions,
          SUM(page_count) AS total_page_count
        FROM visitor_sessions;
      `),

      db.query(`
        SELECT channel AS "channel", COUNT(DISTINCT visitor_session_id) AS "no_of_visitors"
        FROM analytics_events
        GROUP BY channel
        ORDER BY no_of_visitors DESC;
      `),

      db.query(`
        SELECT first_page AS "page", COUNT(DISTINCT visitor_session_id) AS "first_page_titles"
        FROM analytics_events
        GROUP BY first_page
        ORDER BY first_page_titles DESC;
      `),

      db.query(`
        SELECT last_page AS "page", COUNT(DISTINCT visitor_session_id) AS "last_page_titles"
        FROM analytics_events
        GROUP BY last_page
        ORDER BY last_page_titles DESC;
      `),

      db.query(`
        SELECT timezone AS country_region, COUNT(DISTINCT visitor_session_id) AS visitors
        FROM analytics_events
        GROUP BY timezone
        ORDER BY visitors DESC;
      `),

      db.query(`
        SELECT 
          browser,
          COUNT(DISTINCT visitor_session_id) AS visitors,
          ROUND(
            COUNT(DISTINCT visitor_session_id) * 100.0 / SUM(COUNT(DISTINCT visitor_session_id)) OVER (), 
            1
          ) AS percentage
        FROM analytics_events
        GROUP BY browser
        ORDER BY visitors DESC;
      `)
    ]);

    return res.status(200).json({
      uniqueVisitorCount: uniqueVisitors.rows[0],
      sessionStats: sessionStats.rows[0],
      topChannels: topChannels.rows,
      topEntryPages: topEntryPages.rows,
      topExitPages: topExitPages.rows,
      countries: countries.rows,
      browsers: browsers.rows
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch analytics data');
  }
}

// Unique Visitors
export async function getUniqueVisitorCount(req, res) {
  console.log("came into here db")
  const result = await db.query(`
    SELECT COUNT(DISTINCT id) AS unique_visitor_count
    FROM unique_visitors;
  `);
  console.log("result", result.rows[0])
  // return result.rows[0];

      return res.status(200).json({
      "visitors": result.rows[0]
    });
}

// Session Stats
export async function getSessionStats() {
  const result = await db.query(`
    SELECT 
      COUNT(DISTINCT id) AS visitor_sessions,
      SUM(page_count) AS total_page_count
    FROM visitor_sessions;
  `);
  return result.rows[0];
}

// Top Channels
export async function getTopChannels() {
  const result = await db.query(`
    SELECT channel AS "channel", COUNT(DISTINCT visitor_session_id) AS "no_of_visitors"
    FROM analytics_events
    GROUP BY channel
    ORDER BY no_of_visitors DESC;
  `);
  return result.rows;
}

// Top Entry Pages
export async function getTopEntryPages() {
  const result = await db.query(`
    SELECT first_page AS "page", COUNT(DISTINCT visitor_session_id) AS "first_page_titles"
    FROM analytics_events
    GROUP BY first_page
    ORDER BY first_page_titles DESC;
  `);
  return result.rows;
}

// Top Exit Pages
export async function getTopExitPages() {
  const result = await db.query(`
    SELECT last_page AS "page", COUNT(DISTINCT visitor_session_id) AS "last_page_titles"
    FROM analytics_events
    GROUP BY last_page
    ORDER BY last_page_titles DESC;
  `);
  return result.rows;
}

// Countries (using timezone)
export async function getCountries() {
  const result = await db.query(`
    SELECT timezone AS country_region, COUNT(DISTINCT visitor_session_id) AS visitors
    FROM analytics_events
    GROUP BY timezone
    ORDER BY visitors DESC;
  `);
  return result.rows;
}

// Browsers
export async function getBrowsers() {
  const result = await db.query(`
    SELECT 
      browser,
      COUNT(DISTINCT visitor_session_id) AS visitors,
      ROUND(
        COUNT(DISTINCT visitor_session_id) * 100.0 / SUM(COUNT(DISTINCT visitor_session_id)) OVER (), 
        1
      ) AS percentage
    FROM analytics_events
    GROUP BY browser
    ORDER BY visitors DESC;
  `);
  return result.rows;
}
