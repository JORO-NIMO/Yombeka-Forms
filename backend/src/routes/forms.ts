import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

// Public: get form by slug
router.get('/slug/:slug', async (req: any, res: any) => {
  const { slug } = req.params;
  const form = await prisma.form.findUnique({ where: { slug }, include: { fields: true } });
  if (!form) return res.status(404).json({ error: 'Not found' });
  // If paused or past deadline, indicate closed
  const now = new Date();
  const closed = form.isPaused || (form.deadline && form.deadline.getTime() <= now.getTime());
  res.json({ form: { id: form.id, title: form.title, slug: form.slug, fields: form.fields, closed, closedMessage: form.closedMessage } });
});

// Public: submit
router.post('/:slug/submissions', async (req: any, res: any) => {
  const { slug } = req.params;
  const payload = req.body; // expect { answers: { key: value } }
  const form = await prisma.form.findUnique({ where: { slug } });
  if (!form) return res.status(404).json({ error: 'Not found' });
  const now = new Date();
  if (form.isPaused || (form.deadline && form.deadline.getTime() <= now.getTime())) {
    return res.status(403).json({ error: 'Form closed' });
  }
  const submission = await prisma.submission.create({ data: { formId: form.id, data: JSON.stringify(payload) } });
  res.json({ ok: true, id: submission.id });
});

// Pause a form (owner only - for scaffold we skip auth check)
router.post('/:id/pause', async (req: any, res: any) => {
  const { id } = req.params;
  const form = await prisma.form.findUnique({ where: { id } });
  if (!form) return res.status(404).json({ error: 'Not found' });
  await prisma.form.update({ where: { id }, data: { isPaused: true } });
  // create export job
  await prisma.exportJob.create({ data: { formId: id, type: 'csv' } });
  res.json({ ok: true });
});

// Owner: create a form
router.post('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { title } = req.body;
  const form = await prisma.form.create({
    data: {
      ownerId: req.userId!,
      title,
    },
  });
  res.json({ form });
});

// Owner: add field
router.post('/:id/fields', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { key, label, type } = req.body;
  const form = await prisma.form.findUnique({ where: { id } });

  if (!form) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (form.ownerId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const max = await prisma.field.aggregate({ where: { formId: id }, _max: { order: true } });
  const nextOrder = (max._max.order ?? 0) + 1;

  const field = await prisma.field.create({
    data: { formId: id, key, label, type, order: nextOrder },
  });
  res.json({ field });
});

// Owner: reorder fields
router.post('/:id/fields/order', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { order } = req.body; // expect array of field ids in desired order
  const form = await prisma.form.findUnique({ where: { id }, include: { fields: true } });

  if (!form) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (form.ownerId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array' });
  }

  const tx = order.map((fieldId: string, index: number) =>
    prisma.field.update({
      where: { id: fieldId },
      data: { order: index + 1 },
    })
  );

  await prisma.$transaction(tx);

  const fields = await prisma.field.findMany({ where: { formId: id }, orderBy: { order: 'asc' } });
  res.json({ fields });
});

// Owner: list submissions
router.get('/:id/submissions', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const form = await prisma.form.findUnique({ where: { id } });

  if (!form) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (form.ownerId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const submissions = await prisma.submission.findMany({
    where: { formId: id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ submissions });
});

// Owner: export submissions as CSV (immediate)
router.get('/:id/submissions/export', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const form = await prisma.form.findUnique({ where: { id } });

  if (!form) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (form.ownerId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const submissions = await prisma.submission.findMany({
    where: { formId: id },
    orderBy: { createdAt: 'asc' },
  });

  // Build CSV
  const lines = ['id,createdAt,data'];
  for (const s of submissions) {
    const data = JSON.stringify(JSON.parse(s.data).answers || JSON.parse(s.data));
    const row = [s.id, s.createdAt.toISOString(), data];
    const csvRow = row.map((c: any) => '"' + String(c).replace(/"/g, '""') + '"').join(',');
    lines.push(csvRow);
  }
  const csv = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="export-${id}.csv"`);
  res.send(csv);
});
export default router;
