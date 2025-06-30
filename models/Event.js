import Joi from 'joi';

export const eventSchema = Joi.object({
  events: Joi.object({
    pageView: Joi.boolean().required(),
    utmSource: Joi.string().allow('', null).optional(),
    utmMedium: Joi.string().allow('', null).optional(),
    bounceRate: Joi.string().allow('', null).optional(),
    websiteId: Joi.string().uuid().required(),
    domain: Joi.string().required(),
    firstPage: Joi.string().allow('', null).optional(),
    lastPage: Joi.string().allow('', null).optional(),
  }).required(),
});
