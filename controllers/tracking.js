import { eventSchema } from '../models/Event.js';
import { getClientDetails  } from '../utils/tracker.js';

export async function receiveEvent  (req, res)  {
  const { error, value } = eventSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const eventData = value.events;

  const result = await getClientDetails(req)
  console.log("result", result)
  return res.status(200).json({
    message: 'Event received successfully',
    data: result,
  });
};
