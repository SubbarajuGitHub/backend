import Joi from 'joi';

export const eventSchema = Joi.object({
  websiteId: Joi.string().guid().required(),

  channel: Joi.string().allow('', null).optional(),
  referrer: Joi.string().allow('', null).optional(),

  utmParams: Joi.object({
    medium: Joi.string().allow('', null).optional(),
    source: Joi.string().allow('', null).optional(),
    campaign: Joi.string().allow('', null).optional(),
    content: Joi.string().allow('', null).optional(),
    term: Joi.string().allow('', null).optional(),
  }).optional(),

  session: Joi.object({
    firstPage: Joi.string().allow('', null).optional(),
    lastPage: Joi.string().allow('', null).optional(),
    pageCount: Joi.number().optional(),
  }).optional(),

  deviceDetails: Joi.object({
    os: Joi.string().allow('', null).optional(),
    deviceType: Joi.string().allow('', null).optional(),
    resolution: Joi.string().allow('', null).optional(),
    viewport: Joi.string().allow('', null).optional(),
    browser: Joi.string().allow('', null).optional(),
    timezone: Joi.string().allow('', null).optional(),
    language: Joi.string().allow('', null).optional(),
    hardwareConcurrency: Joi.number().optional(),
    userAgent: Joi.string().allow('', null).optional(),
  }).optional(),
});

