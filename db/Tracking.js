import { db } from "../config/database.js"
import { v4 as uuidv4 } from 'uuid';

export async function insertAnalyticsEvent(websiteId, sessionId, data, userAgent) {
  const eventId = uuidv4();
  const value = JSON.parse(data);
  const now = new Date();
  console.log("array", websiteId, "sessionid", sessionId, "value", value, "userAgent", userAgent)
  await db.query(`
    INSERT INTO analytics_events (
      id, website_id, visitor_session_id, timestamp,
      channel, referrer,
      utm_medium, utm_source, utm_campaign, utm_content, utm_term,
      first_page, last_page,
      os, device_type, resolution, viewport, browser,
      timezone, language, hardware_concurrency, user_agent
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13,
      $14, $15, $16, $17, $18,
      $19, $20, $21, $22
    )
  `, [
    eventId, websiteId, sessionId, now,
    value.channel, value.referrer,
    value.utmParams?.medium, value.utmParams?.source, value.utmParams?.campaign,
    value.utmParams?.content, value.utmParams?.term,
    value.session?.firstPage, value.session?.lastPage,
    value.deviceDetails?.os, value.deviceDetails?.deviceType, value.deviceDetails?.resolution,
    value.deviceDetails?.viewport, value.deviceDetails?.browser,
    value.deviceDetails?.timezone, value.deviceDetails?.language,
    value.deviceDetails?.hardwareConcurrency, userAgent
  ]);
}

export async function getData(params) {
  db.query(`SELECT COUNT(DISTINCT id) AS unique_visitor_count
FROM unique_visitors;
`)

  db.query(`SELECT 
  COUNT(DISTINCT id) AS visitor_sessions,
  SUM(page_count) AS total_page_count
FROM visitor_sessions;
`)

  // total page view total_page_count/visitor_sessions

  db.query(`SELECT channel AS "Channel", COUNT(DISTINCT visitor_session_id) AS "no_of_visitors"
FROM analytics_events
GROUP BY channel
ORDER BY no_of_visitors DESC;
`)

  db.query(`SELECT first_page AS "Page", COUNT(DISTINCT visitor_session_id) AS "first_page_titles"
FROM analytics_events
GROUP BY first_page
ORDER BY first_page_titles DESC;
`)

  db.query(`SELECT last_page AS "Page", COUNT(DISTINCT visitor_session_id) AS "last_page_titles"
FROM analytics_events
GROUP BY last_page
ORDER BY last_page_titles DESC;

`)

  db.query(`SELECT 
  timezone AS country_region,
  COUNT(DISTINCT visitor_session_id) AS visitors
FROM analytics_events
GROUP BY timezone
ORDER BY visitors DESC;
`)

  db.query(`SELECT 
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
}