
import { metrics } from '@opentelemetry/api';
import { prisma } from '../config/prisma.js';

const meter = metrics.getMeter('biblio-business');

const availableBooks = meter.createObservableGauge(
  'biblio.books.available',
  {
    description: 'Cantidad actual de libros disponibles para préstamo',
    unit: '{book}',
  },
);

const businessAttributes = {
  app_version: process.env.APP_VERSION || 'unknown',
  app_track: process.env.APP_TRACK || 'unknown',
};

availableBooks.addCallback(async (result) => {
  const count = await prisma.book.count({
    where: {
      loans: {
        none: {
          returnedAt: null,
        },
      },
    },
  });

  result.observe(count, businessAttributes);
});